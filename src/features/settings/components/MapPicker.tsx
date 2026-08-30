"use client";
// src/features/settings/components/MapPicker.tsx
// @eligi:mappicker-openfreemap
//
// Mini mapa com pino arrastavel + geocode gratis (Nominatim/OSM).
//
// O que mudou:
//   - o tile escuro era raster da CARTO, que passou a exigir API key. Dentro do
//     onboarding isso virava a marca dagua APIKEY REQUIRED no segundo passo do
//     cadastro de todo lojista novo.
//   - o Leaflet vinha do unpkg em runtime. Agora e dependencia de verdade,
//     carregada por import() dinamico: sem CDN de terceiro no caminho e com os
//     tipos reais, o que dispensa as interfaces escritas a mao.
//
// Estilo por contexto: 'dark' dentro do onboarding (.ob-root), 'positron' fora.
// Os dois vem do OpenFreeMap, sem chave e sem cota.

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import type * as LeafletNS from "leaflet";
// CSS entra estatico: folha de estilo e resolvida em build, nao com import().
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";

const STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";
const STYLE_LIGHT = "https://tiles.openfreemap.org/styles/positron";
const DEFAULT: [number, number] = [-23.55, -46.63];

interface Props {
  lat: number | null;
  lng: number | null;
  address?: string;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, address, onChange }: Props) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const markerRef = useRef<LeafletNS.Marker | null>(null);
  // onChange em ref: trocar a funcao nao pode remontar o mapa.
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  const [ready, setReady] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        // O plugin do Leaflet le `maplibregl` do escopo global quando e
        // avaliado. Imports ESM sao icados, entao a ordem so e garantida com
        // import() dinamico.
        const L = (await import("leaflet")).default;
        const maplibregl = (await import("maplibre-gl")).default;
        (window as unknown as { maplibregl: unknown }).maplibregl = maplibregl;
        await import("@maplibre/maplibre-gl-leaflet");

        if (!active) return;
        const el = elRef.current;
        if (!el || mapRef.current) { setReady(true); return; }

        const isDark = !!el.closest(".ob-root");
        setDark(isDark);

        const start: [number, number] =
          lat != null && lng != null ? [lat, lng] : DEFAULT;
        const map = L.map(el, { attributionControl: false })
          .setView(start, lat != null ? 16 : 11);

        const withGL = L as unknown as {
          maplibreGL: (o: { style: string }) => LeafletNS.Layer;
        };
        withGL.maplibreGL({ style: isDark ? STYLE_DARK : STYLE_LIGHT }).addTo(map);

        const marker = L.marker(start, { draggable: true }).addTo(map);
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          onChangeRef.current(p.lat, p.lng);
        });
        map.on("click", (e: LeafletNS.LeafletMouseEvent) => {
          marker.setLatLng([e.latlng.lat, e.latlng.lng]);
          onChangeRef.current(e.latlng.lat, e.latlng.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;
        setTimeout(() => map.invalidateSize(), 80);
        setReady(true);
      } catch {
        if (active) { setErr("Mapa indisponivel"); setReady(true); }
      }
    }

    void init();

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
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
    if (!address || !address.trim()) { setErr("Digite o endereco primeiro"); return; }
    setErr(null);
    setGeocoding(true);
    try {
      const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(address);
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (data && data[0]) onChangeRef.current(parseFloat(data[0].lat), parseFloat(data[0].lon));
      else setErr("Endereco nao encontrado");
    } catch {
      setErr("Falha ao localizar");
    } finally {
      setGeocoding(false);
    }
  }

  const muted = dark ? "rgba(255,255,255,0.5)" : "#71717a";

  return (
    <div>
      <button type="button" onClick={geocode} disabled={geocoding} style={dark ? btnDark : btn}>
        {geocoding ? <Loader2 size={14} style={{ animation: "eligi-spin 1s linear infinite" }} /> : <Search size={14} />} Localizar no mapa
      </button>
      <div ref={elRef} style={{ height: 170, borderRadius: 12, overflow: "hidden", marginTop: 8, background: dark ? "#11171a" : "#e9eef2", position: "relative" }}>
        {!ready && <div style={center}><Loader2 size={18} style={{ animation: "eligi-spin 1s linear infinite", color: muted }} /></div>}
        {err && ready && <div style={{ ...center, fontSize: 12, color: muted, gap: 6, flexDirection: "column" }}><MapPin size={16} /> {err}</div>}
      </div>
      <div style={{ fontSize: 11, color: muted, marginTop: 6 }}>Arraste o pino ou clique no mapa pra ajustar.</div>
    </div>
  );
}
const btn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 10, border: "1px solid #e7e7ec", background: "#fff", fontSize: 12.5, fontWeight: 600, color: "#3a3a44", cursor: "pointer" };
const btnDark: React.CSSProperties = { ...btn, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#f4f4f7" };
const center: React.CSSProperties = { position: "absolute", inset: 0, display: "grid", placeItems: "center" };
