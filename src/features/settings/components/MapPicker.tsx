'use client';
// src/features/settings/components/MapPicker.tsx
//
// Mini mapa com pino arrastável + geocode grátis (Nominatim/OSM).
// Leaflet carregado via CDN em runtime — sem dependência nova no build.

import { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';

interface LMap {
  setView(c: [number, number], z: number): LMap;
  on(ev: string, cb: (e: { latlng: { lat: number; lng: number } }) => void): void;
  remove(): void;
  invalidateSize(): void;
}
interface LMarker {
  on(ev: string, cb: () => void): void;
  getLatLng(): { lat: number; lng: number };
  setLatLng(c: [number, number]): LMarker;
  addTo(m: LMap): LMarker;
}
interface LeafletLike {
  map(el: HTMLElement, opts?: object): LMap;
  tileLayer(url: string, opts?: object): { addTo(m: LMap): void };
  marker(c: [number, number], opts?: object): LMarker;
}
function getL(): LeafletLike | undefined {
  return (window as unknown as { L?: LeafletLike }).L;
}
let loader: Promise<void> | null = null;
function loadLeaflet(): Promise<void> {
  if (getL()) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('leaflet'));
    document.head.appendChild(s);
  });
  return loader;
}

const DEFAULT: [number, number] = [-23.55, -46.63];

interface Props {
  lat: number | null;
  lng: number | null;
  address?: string;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, address, onChange }: Props) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LMap | null>(null);
  const markerRef = useRef<LMarker | null>(null);
  const [ready, setReady] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadLeaflet()
      .then(() => {
        if (!active) return;
        const L = getL();
        const el = elRef.current;
        if (!L || !el || mapRef.current) { setReady(true); return; }
        const start: [number, number] = lat != null && lng != null ? [lat, lng] : DEFAULT;
        const map = L.map(el, {}).setView(start, lat != null ? 16 : 11);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
        const marker = L.marker(start, { draggable: true }).addTo(map);
        marker.on('dragend', () => { const p = marker.getLatLng(); onChange(p.lat, p.lng); });
        map.on('click', (e) => { marker.setLatLng([e.latlng.lat, e.latlng.lng]); onChange(e.latlng.lat, e.latlng.lng); });
        mapRef.current = map;
        markerRef.current = marker;
        setTimeout(() => map.invalidateSize(), 80);
        setReady(true);
      })
      .catch(() => { setErr('Mapa indisponível'); setReady(true); });
    return () => {
      active = false;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lat == null || lng == null) return;
    const map = mapRef.current;
    const marker = markerRef.current;
    if (map && marker) { marker.setLatLng([lat, lng]); map.setView([lat, lng], 16); }
  }, [lat, lng]);

  async function geocode() {
    if (!address || !address.trim()) { setErr('Digite o endereço primeiro'); return; }
    setErr(null);
    setGeocoding(true);
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(address);
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (data && data[0]) onChange(parseFloat(data[0].lat), parseFloat(data[0].lon));
      else setErr('Endereço não encontrado');
    } catch {
      setErr('Falha ao localizar');
    } finally {
      setGeocoding(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={geocode} disabled={geocoding} style={btn}>
        {geocoding ? <Loader2 size={14} style={{ animation: 'eligi-spin 1s linear infinite' }} /> : <Search size={14} />} Localizar no mapa
      </button>
      <div ref={elRef} style={{ height: 170, borderRadius: 12, overflow: 'hidden', marginTop: 8, background: '#e9eef2', position: 'relative' }}>
        {!ready && <div style={center}><Loader2 size={18} style={{ animation: 'eligi-spin 1s linear infinite', color: '#71717a' }} /></div>}
        {err && ready && <div style={{ ...center, fontSize: 12, color: '#71717a', gap: 6, flexDirection: 'column' }}><MapPin size={16} /> {err}</div>}
      </div>
      <div style={{ fontSize: 11, color: '#71717a', marginTop: 6 }}>Arraste o pino ou clique no mapa pra ajustar.</div>
    </div>
  );
}
const btn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 10, border: '1px solid #e7e7ec', background: '#fff', fontSize: 12.5, fontWeight: 600, color: '#3a3a44', cursor: 'pointer' };
const center: React.CSSProperties = { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' };
