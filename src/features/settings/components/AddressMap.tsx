'use client'
// src/features/settings/components/AddressMap.tsx
// @eligi:addr-map — mapa do endereco em Configuracoes > Perfil e endereco.
//
// Diferente do MapPicker (onboarding), este mapa foi feito para o celular:
// - Com o dedo, o mapa NAO arrasta: um dedo continua rolando a pagina (antes o
//   mapa prendia a rolagem e a folha ficava sem saida). Mover o mapa e com dois
//   dedos ou com os botoes; o pino arrasta com um dedo; tocar no mapa leva o pino.
// - Botoes de zoom com 44 px (os do Leaflet tem 30).
// - O mapa so "voa" ate o pino quando `focusKey` muda (CEP, sugestao, minha
//   localizacao). Arrastar o pino nao recentra nada.
// O MapPicker do onboarding nao mudou: ele segue no caminho de cadastro.

import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin, Minus, Plus } from 'lucide-react'
import type * as LeafletNS from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'maplibre-gl/dist/maplibre-gl.css'

const STYLE = 'https://tiles.openfreemap.org/styles/positron'
/** Centro do Brasil, quando ainda nao ha pino. */
const BRASIL: [number, number] = [-14.2, -51.9]

// Ponta do bico em (18, 44): a coordenada e o ponto que a pessoa ve.
const PIN_HTML =
  '<div style="position:relative;width:36px;height:44px;filter:drop-shadow(0 3px 6px rgba(17,17,20,.35))">' +
  '<div style="width:36px;height:36px;border-radius:50%;background:#111114;display:grid;place-items:center">' +
  '<div style="width:12px;height:12px;border-radius:50%;background:#fff"></div></div>' +
  '<div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:0;height:0;' +
  'border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid #111114"></div></div>'

interface Props {
  lat: number | null
  lng: number | null
  /** Muda quando o pino veio de fora (CEP, sugestao, GPS): o mapa vai ate ele. */
  focusKey: number
  onChange: (lat: number, lng: number) => void
  height: number
}

export default function AddressMap({ lat, lng, focusKey, onChange, height }: Props) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletNS.Map | null>(null)
  const markerRef = useRef<LeafletNS.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })
  const latRef = useRef(lat)
  const lngRef = useRef(lng)
  useEffect(() => { latRef.current = lat; lngRef.current = lng })

  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')

  useEffect(() => {
    let active = true
    async function init() {
      try {
        const L = (await import('leaflet')).default
        const maplibregl = (await import('maplibre-gl')).default
        ;(window as unknown as { maplibregl: unknown }).maplibregl = maplibregl
        await import('@maplibre/maplibre-gl-leaflet')
        if (!active) return
        const el = elRef.current
        if (!el || mapRef.current) return

        const touch = window.matchMedia('(pointer: coarse)').matches
        const has = latRef.current != null && lngRef.current != null
        const start: [number, number] = has ? [latRef.current as number, lngRef.current as number] : BRASIL
        const map = L.map(el, {
          attributionControl: false,
          zoomControl: false,
          dragging: !touch, // um dedo rola a pagina; dois dedos movem o mapa
          scrollWheelZoom: false, // rodinha rola a pagina; zoom pelos botoes
          touchZoom: true,
        }).setView(start, has ? 17 : 4)

        const withGL = L as unknown as { maplibreGL: (o: { style: string }) => LeafletNS.Layer }
        withGL.maplibreGL({ style: STYLE }).addTo(map)

        const icon = L.divIcon({ className: 'eligi-addr-pin', html: PIN_HTML, iconSize: [36, 44], iconAnchor: [18, 44] })
        const marker = L.marker(start, { draggable: true, icon, keyboard: true, title: 'Local do estabelecimento' })
        if (has) marker.addTo(map)
        marker.on('dragend', () => {
          const p = marker.getLatLng()
          onChangeRef.current(p.lat, p.lng)
        })
        map.on('click', (e: LeafletNS.LeafletMouseEvent) => {
          marker.setLatLng(e.latlng)
          if (!map.hasLayer(marker)) marker.addTo(map)
          onChangeRef.current(e.latlng.lat, e.latlng.lng)
        })

        mapRef.current = map
        markerRef.current = marker
        setTimeout(() => map.invalidateSize(), 120)
        setState('ready')
      } catch (e) {
        console.error('[perfil/endereco] mapa', e)
        if (active) setState('failed')
      }
    }
    void init()
    return () => {
      active = false
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  // Pino que veio de fora: mostra e vai ate ele.
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker || latRef.current == null || lngRef.current == null) return
    const p: [number, number] = [latRef.current, lngRef.current]
    marker.setLatLng(p)
    if (!map.hasLayer(marker)) marker.addTo(map)
    map.setView(p, Math.max(map.getZoom(), 17))
  }, [focusKey, state])

  const zoom = (d: number) => mapRef.current?.setZoom((mapRef.current?.getZoom() ?? 15) + d)

  return (
    <div className="addr-map" style={{ height }}>
      <div ref={elRef} style={{ position: 'absolute', inset: 0 }} aria-label="Mapa do endereço" />
      {state === 'loading' && (
        <div className="addr-map-over"><Loader2 size={20} className="addr-spin" aria-hidden /><span>Carregando o mapa…</span></div>
      )}
      {state === 'failed' && (
        <div className="addr-map-over" role="status">
          <MapPin size={18} aria-hidden />
          <span>O mapa não abriu agora. O pino ainda pode vir do CEP, da rua ou da sua localização.</span>
        </div>
      )}
      {state === 'ready' && (
        <div className="addr-zoom" role="group" aria-label="Zoom do mapa">
          <button type="button" onClick={() => zoom(1)} aria-label="Aproximar"><Plus size={18} /></button>
          <button type="button" onClick={() => zoom(-1)} aria-label="Afastar"><Minus size={18} /></button>
        </div>
      )}
    </div>
  )
}
