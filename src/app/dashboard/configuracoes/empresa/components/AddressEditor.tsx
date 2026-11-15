'use client'
// src/app/dashboard/configuracoes/empresa/components/AddressEditor.tsx
// @eligi:perfil-endereco — endereco em partes + pino no mapa (ver @eligi:doc-cfg-perfil).
//
// Caminhos para chegar no lugar certo, do mais facil ao mais fino:
//   1. CEP: preenche rua, bairro, cidade e UF (ViaCEP) e poe o pino na rua.
//   2. Rua com sugestoes (Photon): escolher uma sugestao preenche tudo e poe o pino.
//   3. "Usar minha localizacao" (para quem esta no proprio estabelecimento).
//   4. Ajuste fino: arrastar o pino ou tocar no mapa.
// Numero e complemento sao do lojista: o mapa raramente tem o numero da casa.
// Salvar manda as PARTES; a linha que o cliente ve e montada no back.

import { useEffect, useRef, useState } from 'react'
import { Crosshair, Loader2, LocateFixed, MapPin, Trash2 } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import AddressAutocomplete from '@/features/settings/components/AddressAutocomplete'
import AddressMap from '@/features/settings/components/AddressMap'
import { geocodeOnce, type AddressHit } from '@/features/settings/lib/geocode'
import { cepDigits, formatCep, lookupCep } from '@/features/settings/lib/cep'
import ProfileSheet from './ProfileSheet'

export interface AddressParts {
  street: string | null
  number: string | null
  complement: string | null
  district: string | null
  city: string | null
  state: string | null
  cep: string | null
}

export interface AddressView {
  address: string | null
  lat: number | null
  lng: number | null
  addressParts: AddressParts
}

type Field = 'street' | 'number' | 'complement' | 'district' | 'city' | 'state' | 'cep' | 'pin'
type Errors = Partial<Record<Field, string>>

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]
const ORDER: Field[] = ['cep', 'street', 'number', 'complement', 'district', 'city', 'state', 'pin']

function errorOf(e: unknown): { message: string; fieldErrors?: Errors; offline: boolean } {
  const r = (e as { response?: { status?: number; data?: { error?: string; message?: string; fieldErrors?: Errors } } })?.response
  if (!r) return { message: 'Sem conexão com a internet. Tente de novo.', offline: true }
  if (r.status === 404) return { message: 'Só o dono do estabelecimento muda o endereço.', offline: false }
  return { message: r.data?.error ?? r.data?.message ?? 'Não foi possível salvar. Tente de novo.', fieldErrors: r.data?.fieldErrors, offline: false }
}

/** Mesmas regras do back (address.rules.ts), para avisar antes de enviar. */
function validate(v: {
  street: string; number: string; noNumber: boolean; city: string; state: string; cep: string
  lat: number | null; lng: number | null
}): Errors {
  const e: Errors = {}
  if (v.street.trim().length < 2) e.street = 'Informe a rua.'
  if (!v.noNumber && !v.number.trim()) e.number = 'Informe o número ou marque "sem número".'
  if (v.city.trim().length < 2) e.city = 'Informe a cidade.'
  if (!UFS.includes(v.state.trim().toUpperCase())) e.state = 'Escolha o estado (UF).'
  const c = cepDigits(v.cep)
  if (c && c.length !== 8) e.cep = 'O CEP tem 8 números.'
  if (v.lat == null || v.lng == null) e.pin = 'Marque o local no mapa.'
  return e
}

interface Props {
  initial: AddressView
  onClose: () => void
  onSaved: (v: AddressView) => void
}

export default function AddressEditor({ initial, onClose, onSaved }: Props) {
  const p = initial.addressParts
  const [cep, setCep] = useState(formatCep(p.cep ?? ''))
  const [street, setStreet] = useState(p.street ?? '')
  const [number, setNumber] = useState(p.number ?? '')
  const [noNumber, setNoNumber] = useState(!!p.street && p.number === null)
  const [complement, setComplement] = useState(p.complement ?? '')
  const [district, setDistrict] = useState(p.district ?? '')
  const [city, setCity] = useState(p.city ?? '')
  const [uf, setUf] = useState(p.state ?? '')
  const [lat, setLat] = useState<number | null>(initial.lat)
  const [lng, setLng] = useState<number | null>(initial.lng)
  const [focusKey, setFocusKey] = useState(0)

  const [errors, setErrors] = useState<Errors>({})
  const [note, setNote] = useState<{ text: string; tone: 'ok' | 'warn' } | null>(null)
  const [cepBusy, setCepBusy] = useState(false)
  const [busy, setBusy] = useState<null | 'save' | 'locate' | 'geo' | 'clear'>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [mapH, setMapH] = useState(260)
  const cepCtrl = useRef<AbortController | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  // Altura do mapa: mais alto no computador. Lido uma vez, sem isMobile no render.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setMapH(mq.matches ? 340 : 260)
    apply()
    mq.addEventListener('change', apply)
    return () => { mq.removeEventListener('change', apply); cepCtrl.current?.abort() }
  }, [])

  const legacy = !p.street && initial.address ? initial.address : null
  const clearErr = (f: Field) => setErrors((e) => (e[f] ? { ...e, [f]: undefined } : e))

  function placePin(la: number, ln: number) {
    setLat(la); setLng(ln); setFocusKey((k) => k + 1); clearErr('pin')
  }

  async function pinFromText(rua: string, cidade: string, estado: string): Promise<boolean> {
    const q = [rua, [cidade, estado].filter(Boolean).join(' - ')].filter(Boolean).join(', ')
    if (!q.trim()) return false
    try {
      const hit = (await geocodeOnce(q)) ?? (cidade ? await geocodeOnce(`${cidade} - ${estado}`) : null)
      if (!hit) return false
      placePin(hit.lat, hit.lng)
      return true
    } catch (e) {
      console.warn('[perfil/endereco] geocode', e)
      return false
    }
  }

  async function onCepChange(raw: string) {
    const masked = formatCep(raw)
    setCep(masked); clearErr('cep')
    const d = cepDigits(masked)
    if (d.length !== 8) return
    cepCtrl.current?.abort()
    const ctrl = new AbortController()
    cepCtrl.current = ctrl
    setCepBusy(true); setNote(null)
    try {
      const r = await lookupCep(d, ctrl.signal)
      if (ctrl.signal.aborted) return
      if (!r) { setErrors((e) => ({ ...e, cep: 'CEP não encontrado. Confira os números.' })); return }
      if (r.street) setStreet(r.street)
      if (r.district) setDistrict(r.district)
      setCity(r.city); setUf(r.state)
      setErrors((e) => ({ ...e, street: undefined, city: undefined, state: undefined }))
      const pinned = await pinFromText(r.street, r.city, r.state)
      setNote(pinned
        ? { text: 'Achamos o endereço. Confira o pino no mapa e arraste se precisar.', tone: 'ok' }
        : { text: 'Achamos a rua, mas não o ponto no mapa. Toque no mapa no lugar certo.', tone: 'warn' })
    } catch (e) {
      if (ctrl.signal.aborted) return
      console.warn('[perfil/endereco] cep', e)
      setNote({ text: 'A busca de CEP não respondeu. Preencha a rua e a cidade à mão.', tone: 'warn' })
    } finally {
      if (cepCtrl.current === ctrl) setCepBusy(false)
    }
  }

  function onPickStreet(h: AddressHit) {
    setStreet(h.street || street)
    if (h.houseNumber && !number) { setNumber(h.houseNumber); setNoNumber(false) }
    if (h.district) setDistrict(h.district)
    if (h.city) setCity(h.city)
    if (h.state) setUf(h.state)
    if (h.postcode && cepDigits(h.postcode).length === 8) setCep(formatCep(h.postcode))
    placePin(h.lat, h.lng)
    setErrors((e) => ({ ...e, street: undefined, city: undefined, state: undefined }))
    setNote({ text: 'Pino colocado na rua. Confira e arraste até a porta do estabelecimento.', tone: 'ok' })
  }

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setNote({ text: 'Este aparelho não informa a localização. Use o CEP ou toque no mapa.', tone: 'warn' })
      return
    }
    setBusy('locate'); setNote(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        placePin(pos.coords.latitude, pos.coords.longitude)
        setNote({ text: `Pino na sua localização (precisão de ~${Math.round(pos.coords.accuracy)} m). Funciona se você estiver no estabelecimento.`, tone: 'ok' })
        setBusy(null)
      },
      (err) => {
        setNote({
          text: err.code === err.PERMISSION_DENIED
            ? 'O navegador não liberou a localização. Libere nas permissões do site ou use o CEP.'
            : 'Não foi possível achar sua localização agora. Use o CEP ou toque no mapa.',
          tone: 'warn',
        })
        setBusy(null)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  }

  async function locateByAddress() {
    setBusy('geo'); setNote(null)
    const rua = [street.trim(), noNumber ? '' : number.trim()].filter(Boolean).join(', ')
    const ok = await pinFromText(rua, city.trim(), uf.trim().toUpperCase())
    setNote(ok
      ? { text: 'Pino colocado pelo endereço. Confira no mapa.', tone: 'ok' }
      : { text: 'Não achamos esse endereço no mapa. Toque no mapa no lugar certo.', tone: 'warn' })
    setBusy(null)
  }

  function focusFirst(e: Errors) {
    const first = ORDER.find((f) => e[f])
    if (!first) return
    const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const input = el?.querySelector<HTMLInputElement>('input')
    input?.focus({ preventScroll: true })
  }

  async function save() {
    if (busy) return
    const v = { street, number, noNumber, city, state: uf, cep, lat, lng }
    const e = validate(v)
    if (Object.keys(e).length) { setErrors(e); setNote(null); focusFirst(e); return }
    setBusy('save'); setNote(null)
    try {
      const r = await api.patch('/business-settings/address', {
        street, number: noNumber ? '' : number, noNumber, complement, district, city,
        state: uf.trim().toUpperCase(), cep: cepDigits(cep), lat, lng,
      })
      onSaved((r.data?.data ?? r.data) as AddressView)
    } catch (err) {
      const x = errorOf(err)
      console.error('[perfil/endereco] salvar', err)
      if (x.fieldErrors) { setErrors(x.fieldErrors); focusFirst(x.fieldErrors) }
      setNote({ text: x.message, tone: 'warn' })
      setBusy(null)
    }
  }

  async function clearAddress() {
    if (busy) return
    setBusy('clear'); setNote(null)
    try {
      const r = await api.delete('/business-settings/address')
      onSaved((r.data?.data ?? r.data) as AddressView)
    } catch (err) {
      console.error('[perfil/endereco] tirar', err)
      setNote({ text: errorOf(err).message, tone: 'warn' })
      setBusy(null)
      setConfirmClear(false)
    }
  }

  const err = (f: Field) => errors[f] ? <span className="pf-err" id={`addr-${f}-e`} role="alert">{errors[f]}</span> : null
  const inv = (f: Field) => (errors[f] ? { 'aria-invalid': true, 'aria-describedby': `addr-${f}-e` } as const : {})

  const footer = (
    <>
      {note && <div className={`pf-note ${note.tone}`} role="status">{note.text}</div>}
      <button type="button" className="pf-save" onClick={save} disabled={busy !== null}>
        {busy === 'save' ? <><Loader2 size={17} className="addr-spin" aria-hidden /> Salvando…</> : 'Salvar endereço'}
      </button>
    </>
  )

  return (
    <ProfileSheet
      title="Endereço"
      subtitle="Aparece no seu link, no mapa e no botão “Como chegar”. Comece pelo CEP."
      width={680}
      onClose={onClose}
      footer={footer}
    >
      <div ref={formRef} className="addr-form">
        {legacy && (
          <div className="pf-note warn">
            Hoje está assim: <b>{legacy}</b>. Preencha em partes abaixo para o cliente achar o lugar certo.
          </div>
        )}

        <div className="addr-grid">
          <label className="pf-fld addr-cep" data-field="cep">
            <span className="pf-lb">CEP</span>
            <span className="addr-cepbox">
              <input
                value={cep}
                onChange={(e) => void onCepChange(e.target.value)}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
                maxLength={9}
                {...inv('cep')}
              />
              {cepBusy && <Loader2 size={16} className="addr-spin addr-cepspin" aria-label="Buscando CEP" />}
            </span>
            {err('cep')}
          </label>

          <div className="pf-fld addr-street" data-field="street">
            <span className="pf-lb">Rua</span>
            <AddressAutocomplete
              value={street}
              onTextChange={(v) => { setStreet(v); clearErr('street') }}
              onPick={onPickStreet}
              placeholder="Comece a digitar a rua"
              pickText={(h) => h.street || h.label.split(" | ")[0]}
            />
            {err('street')}
          </div>

          <label className="pf-fld" data-field="number">
            <span className="pf-lb">Número</span>
            <input
              value={noNumber ? '' : number}
              onChange={(e) => { setNumber(e.target.value); clearErr('number') }}
              disabled={noNumber}
              inputMode="text"
              placeholder={noNumber ? 's/n' : 'Ex.: 120'}
              maxLength={10}
              {...inv('number')}
            />
            {err('number')}
          </label>

          <div className="pf-fld addr-sn">
            <span className="pf-lb" aria-hidden>&nbsp;</span>
            <button
              type="button"
              className="pf-chip"
              aria-pressed={noNumber}
              onClick={() => { setNoNumber((v) => !v); clearErr('number') }}
            >
              Sem número
            </button>
          </div>

          <label className="pf-fld addr-full" data-field="complement">
            <span className="pf-lb">Complemento <i>(opcional)</i></span>
            <input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Sala, loja, andar, ponto de referência" maxLength={60} />
          </label>

          <label className="pf-fld addr-full" data-field="district">
            <span className="pf-lb">Bairro</span>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Ex.: Centro" maxLength={80} autoComplete="address-level3" />
          </label>

          <label className="pf-fld addr-city" data-field="city">
            <span className="pf-lb">Cidade</span>
            <input value={city} onChange={(e) => { setCity(e.target.value); clearErr('city') }} maxLength={80} autoComplete="address-level2" {...inv('city')} />
            {err('city')}
          </label>

          <label className="pf-fld addr-uf" data-field="state">
            <span className="pf-lb">UF</span>
            <input
              value={uf}
              onChange={(e) => { setUf(e.target.value.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 2)); clearErr('state') }}
              maxLength={2}
              autoComplete="address-level1"
              placeholder="SP"
              {...inv('state')}
            />
            {err('state')}
          </label>
        </div>

        <div className="addr-mapsec" data-field="pin">
          <div className="addr-maphead">
            <span className="pf-lb" style={{ margin: 0 }}>Local no mapa</span>
            <span className="addr-mapstate">
              {lat != null && lng != null ? <><MapPin size={14} aria-hidden /> Pino marcado</> : 'Sem pino ainda'}
            </span>
          </div>
          <div className="addr-mapbtns">
            <button type="button" className="pf-btn" onClick={locateByAddress} disabled={busy !== null}>
              {busy === 'geo' ? <Loader2 size={16} className="addr-spin" aria-hidden /> : <Crosshair size={16} aria-hidden />}
              Localizar pelo endereço
            </button>
            <button type="button" className="pf-btn" onClick={useMyLocation} disabled={busy !== null}>
              {busy === 'locate' ? <Loader2 size={16} className="addr-spin" aria-hidden /> : <LocateFixed size={16} aria-hidden />}
              Usar minha localização
            </button>
          </div>
          <AddressMap lat={lat} lng={lng} focusKey={focusKey} onChange={(la, ln) => { setLat(la); setLng(ln); clearErr('pin') }} height={mapH} />
          <p className="addr-hint">Arraste o pino até a porta ou toque no mapa. No celular, use dois dedos para mover o mapa.</p>
          {err('pin')}
        </div>

        {initial.address && (
          <div className="addr-clear">
            {confirmClear ? (
              <div className="pf-confirm" role="alertdialog" aria-label="Tirar endereço do link">
                <p>O link deixa de mostrar endereço e mapa, e você sai do <b>Perto de você</b> até pôr um endereço de novo. Cidade e UF ficam.</p>
                <div className="pf-confirm-row">
                  <button type="button" className="pf-btn" onClick={() => setConfirmClear(false)} disabled={busy !== null}>Manter</button>
                  <button type="button" className="pf-btn danger" onClick={clearAddress} disabled={busy !== null}>
                    {busy === 'clear' ? <Loader2 size={16} className="addr-spin" aria-hidden /> : <Trash2 size={16} aria-hidden />}
                    Tirar do link
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="pf-link danger" onClick={() => setConfirmClear(true)}>
                Atendo em domicílio / tirar o endereço do link
              </button>
            )}
          </div>
        )}
      </div>
    </ProfileSheet>
  )
}
