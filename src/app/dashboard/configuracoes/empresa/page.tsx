'use client'
// src/app/dashboard/configuracoes/empresa/page.tsx
// @eligi:perfil-v2 — Perfil e endereco, direcao B (ver @eligi:doc-cfg-perfil).
//
// Um cartao por assunto com o que vale hoje; cada um abre uma folha e salva so
// o seu pedaco. No computador a previa do link fica ao lado (tocar numa parte
// dela abre a folha certa); no celular, "Ver como o cliente ve" abre a previa.
// Fechar uma folha sem salvar desfaz o que foi mexido nela (snapshot do rascunho).

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlignLeft, Camera, ChevronLeft, ChevronRight, ExternalLink, Eye, Image as ImageIcon,
  Loader2, MapPin, Palette, Share2, Store,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { typography } from '@/shared/theme'
import {
  checkReadability, coverBackground, type BusinessSocials, type BusinessTheme, type ThemePreset,
} from '@/shared/profileTheme'
import { useBusinessProfileDraft, SECTION_LABEL, type GalleryItemInit, type ProfileSection } from '@/features/settings/hooks/useBusinessProfileDraft'
import BusinessPreview, { initialsOf, type PreviewLive, type PreviewSlot } from '@/features/settings/components/BusinessPreview'
import { openStatus } from '@/features/settings/lib/openStatus' // @eligi:preview-live-import
import { styleLabel } from '@/features/settings/components/ProfileFields' // @eligi:cores-estilo-import
import { getMe } from '@/lib/auth.api'
import ImageCropper from '@/features/settings/components/ImageCropper'
import { uploadBlob } from '@/shared/utils/uploadImage'
import type { ImagePresetName } from '@/shared/utils/imageCompress'
import TimezoneCard from './components/TimezoneCard'
import DiscoverCard, { type DiscoverStatus } from './components/DiscoverCard'
import ProfileSheet from './components/ProfileSheet'
import AddressEditor, { type AddressParts, type AddressView } from './components/AddressEditor'
import {
  AboutEditor, ColorsEditor, CoverEditor, LogoEditor, PhotosEditor, SocialsEditor, GALLERY_MAX,
  coverLabel, normalizeInstagram, normalizeWebsite, socialErrors, type CropTarget, type SocialErrors,
} from './components/ProfileEditors'
import { PROFILE_CSS } from './components/profileStyles'

interface BusinessSettings {
  id: string
  name: string
  timezone: string
  theme: BusinessTheme
  logoUrl: string | null
  coverUrl: string | null
  about: string | null
  address: string | null
  lat: number | null
  lng: number | null
  addressParts?: AddressParts // back antigo: ausente
  socials: BusinessSocials | null
  gallery: string[] | null
  galleryItems?: GalleryItemInit[] | null
  discover?: DiscoverStatus | null
}

type SheetKey = 'logo' | 'cover' | 'about' | 'colors' | 'photos' | 'socials' | 'address' | 'preview'

const SHEET: Record<Exclude<SheetKey, 'address' | 'preview'>, { title: string; save: string; sections: ProfileSection[]; done: string }> = {
  logo: { title: 'Logo', save: 'Salvar logo', sections: ['images', 'theme'], done: 'Logo salvo' },
  cover: { title: 'Capa', save: 'Salvar capa', sections: ['images'], done: 'Capa salva' },
  about: { title: 'Sobre', save: 'Salvar texto', sections: ['profile'], done: 'Texto salvo' },
  colors: { title: 'Cores do link', save: 'Salvar cores', sections: ['theme'], done: 'Cores salvas' },
  photos: { title: 'Fotos do espaço', save: 'Salvar fotos', sections: ['gallery'], done: 'Fotos salvas' },
  socials: { title: 'Redes e contato', save: 'Salvar contatos', sections: ['profile'], done: 'Contatos salvos' },
}

const SLOT_TO_SHEET: Record<PreviewSlot, SheetKey> = {
  logo: 'logo', cover: 'cover', appearance: 'colors', about: 'about', address: 'address', socials: 'socials', photos: 'photos',
}

/* ---------- extracao de cores do logo (so no navegador) ---------- */
function extractPalette(img: HTMLImageElement, count = 6): string[] {
  const cv = document.createElement('canvas')
  const w = (cv.width = 84)
  const h = (cv.height = Math.max(1, Math.round((84 * img.height) / img.width)) || 84)
  const ctx = cv.getContext('2d')
  if (!ctx) return []
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h).data
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>()
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
    if (a < 120) continue
    const k = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    const o = buckets.get(k) ?? { r: 0, g: 0, b: 0, n: 0 }
    o.r += r; o.g += g; o.b += b; o.n++
    buckets.set(k, o)
  }
  const arr = Array.from(buckets.values()).map((o) => {
    const r = Math.round(o.r / o.n), g = Math.round(o.g / o.n), b = Math.round(o.b / o.n)
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
    const sat = mx === 0 ? 0 : (mx - mn) / mx
    return { r, g, b, score: o.n * (0.3 + sat * 1.4) }
  })
  arr.sort((a, b) => b.score - a.score)
  const hex = (n: number) => n.toString(16).padStart(2, '0')
  const out: Array<{ r: number; g: number; b: number }> = []
  for (const o of arr) {
    if (out.every((p) => Math.abs(p.r - o.r) + Math.abs(p.g - o.g) + Math.abs(p.b - o.b) > 70)) {
      out.push(o)
      if (out.length >= count) break
    }
  }
  return out.map((o) => `#${hex(o.r)}${hex(o.g)}${hex(o.b)}`)
}

type CropState = { src: string; aspect: number; outW: number; outH: number; target: CropTarget } | null

// Busca pura: o setState fica no .then de quem chama (regra do React Compiler).
function fetchSettings(): Promise<BusinessSettings> {
  return api.get('/business-settings').then((r) => r.data?.data as BusinessSettings)
}

// @eligi:preview-live
// O que a previa mostra e nao se edita aqui (servicos, equipe, horario, nota)
// vem do proprio link publico, para a previa ser o que o cliente ve. Sem slug
// ou com erro: null, e a previa segue sem esses blocos.
type PublicProfileLite = {
  business?: { timezone?: string; discoverable?: boolean }
  hours?: PreviewLive['hours']
  services?: PreviewLive['services']
  professionals?: PreviewLive['professionals']
  rating?: PreviewLive['rating']
}
function fetchLive(): Promise<PreviewLive | null> {
  return getMe().then((me) => {
    const slug = me?.businessSlug
    if (!slug) return null
    return api.get(`/public/${encodeURIComponent(slug)}`).then((r) => {
      const p = r.data as PublicProfileLite
      const hours = Array.isArray(p?.hours) ? p.hours : []
      return {
        hours,
        services: Array.isArray(p?.services) ? p.services : [],
        professionals: Array.isArray(p?.professionals) ? p.professionals : [],
        rating: p?.rating ?? null,
        discoverable: p?.business?.discoverable !== false,
        status: openStatus(hours, p?.business?.timezone || 'America/Sao_Paulo', new Date()),
      }
    })
  })
}

export default function EmpresaPage() {
  const [load, setLoad] = useState<{ data: BusinessSettings | null; failed: boolean } | null>(null)

  const carregar = useCallback(() => {
    fetchSettings()
      .then((data) => setLoad({ data: data ?? null, failed: !data }))
      .catch((e) => { console.error('[perfil] carregar', e); setLoad({ data: null, failed: true }) })
  }, [])

  useEffect(() => {
    let vivo = true
    fetchSettings()
      .then((data) => { if (vivo) setLoad({ data: data ?? null, failed: !data }) })
      .catch((e) => { console.error('[perfil] carregar', e); if (vivo) setLoad({ data: null, failed: true }) })
    return () => { vivo = false }
  }, [])

  return (
    <>
      <style>{PROFILE_CSS(typography)}</style>
      <div className="pf">
        <Link href="/dashboard/configuracoes" className="pf-back"><ChevronLeft size={18} aria-hidden />Configurações</Link>
        <h1 className="pf-h1">Perfil e endereço</h1>
        <p className="pf-lead">O que o cliente vê no seu link de agendamento: nome, logo, fotos, onde fica e como falar com você.</p>

        {load === null && (
          <div className="pf-list" aria-busy="true" aria-label="Carregando">
            {[0, 1, 2, 3].map((i) => <div key={i} className="pf-skel" />)}
          </div>
        )}
        {load?.failed && (
          <div className="pf-errbox" role="alert">
            Não foi possível carregar o perfil.
            <div><button type="button" className="pf-save" style={{ width: 'auto', marginTop: 12 }} onClick={() => { setLoad(null); carregar() }}>Tentar de novo</button></div>
          </div>
        )}
        {load?.data && <ProfileScreen key={load.data.id} data={load.data} />}
      </div>
    </>
  )
}

function ProfileScreen({ data }: { data: BusinessSettings }) {
  const draft = useBusinessProfileDraft({
    theme: data.theme, logo: data.logoUrl, cover: data.coverUrl, about: data.about,
    address: data.address, lat: data.lat, lng: data.lng, socials: data.socials,
    gallery: data.gallery, galleryItems: data.galleryItems ?? null,
  })
  const [addr, setAddr] = useState<AddressView>(() => ({
    address: data.address, lat: data.lat, lng: data.lng,
    addressParts: data.addressParts ?? { street: null, number: null, complement: null, district: null, city: null, state: null, cep: null },
  }))
  const [discover, setDiscover] = useState<DiscoverStatus | null>(data.discover ?? null)
  const [discoverRev, setDiscoverRev] = useState(0)
  const [live, setLive] = useState<PreviewLive | null | undefined>(undefined) // @eligi:preview-live-state
  useEffect(() => {
    let vivo = true
    fetchLive()
      .then((v) => { if (vivo) setLive(v) })
      .catch((e) => { console.error('[perfil] previa do link', e); if (vivo) setLive(null) })
    return () => { vivo = false }
  }, [])

  const [sheet, setSheet] = useState<SheetKey | null>(null)
  const snapRef = useRef<ReturnType<typeof draft.snapshot> | null>(null)
  const [extracted, setExtracted] = useState<string[]>([])
  const [crop, setCrop] = useState<CropState>(null)
  const [uploading, setUploading] = useState(0)
  const [uploadErr, setUploadErr] = useState<string | null>(null)
  const [photoSel, setPhotoSel] = useState<number | null>(null)
  const [socErr, setSocErr] = useState<SocialErrors>({})
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  const readability = useMemo(() => checkReadability(draft.theme), [draft.theme])

  function avisar(t: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(t)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }

  function openSheet(k: SheetKey) {
    snapRef.current = k === 'address' || k === 'preview' ? null : draft.snapshot()
    setUploadErr(null); setSocErr({}); setPhotoSel(null)
    setSheet(k)
  }

  function closeSheet() {
    if (snapRef.current) draft.restore(snapRef.current)
    snapRef.current = null
    setSheet(null); setPhotoSel(null); setExtracted([])
  }

  function refreshDiscover() {
    fetchSettings()
      .then((d) => { if (d?.discover) { setDiscover(d.discover); setDiscoverRev((r) => r + 1) } })
      .catch((e) => console.warn('[perfil] status do Perto de voce', e))
  }

  async function saveSheet(k: Exclude<SheetKey, 'address' | 'preview'>) {
    if (uploading > 0) return
    if (k === 'socials') {
      const s: BusinessSocials = {
        ...draft.socials,
        instagram: normalizeInstagram(draft.socials.instagram ?? ''),
        website: normalizeWebsite(draft.socials.website ?? ''),
      }
      const e = socialErrors(s)
      setSocErr(e)
      if (Object.keys(e).length) return
      draft.setSocials(s)
    }
    let ok = true
    for (const section of SHEET[k].sections) {
      // Em serie: sao escritas no mesmo registro.
      if (!(await draft.saveSection(section))) ok = false
    }
    if (!ok) return // folha fica aberta com o erro visivel
    snapRef.current = null
    setSheet(null); setPhotoSel(null); setExtracted([])
    avisar(SHEET[k].done)
  }

  /* ---------- recorte e envio de imagem ---------- */
  function openCrop(file: File, target: CropTarget) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setUploadErr('Use uma imagem JPG, PNG ou WebP.'); return }
    if (file.size > 15 * 1024 * 1024) { setUploadErr('Imagem muito grande (mais de 15 MB). Escolha outra.'); return }
    setUploadErr(null)
    const src = URL.createObjectURL(file)
    if (target === 'logo') setCrop({ src, aspect: 1, outW: 512, outH: 512, target })
    else if (target === 'cover') setCrop({ src, aspect: 16 / 9, outW: 1200, outH: 675, target })
    else setCrop({ src, aspect: 1, outW: 800, outH: 800, target })
  }

  // A paleta sai do dataUrl LOCAL antes do upload: imagem de outro dominio
  // deixa o canvas "tainted" e getImageData falha.
  async function applyCrop(dataUrl: string, blob: Blob) {
    const target = crop?.target
    if (crop?.src) URL.revokeObjectURL(crop.src)
    setCrop(null)
    if (!target) return
    if (target === 'logo') {
      draft.setLogoUrl(dataUrl)
      const img = new Image()
      img.onload = () => {
        const cols = extractPalette(img, 6)
        setExtracted(cols)
        if (cols[0]) draft.setTheme((t) => ({ ...t, primary: cols[0], onPrimary: 'auto' }))
      }
      img.src = dataUrl
    } else if (target === 'cover') {
      draft.setCoverUrl(dataUrl)
    } else {
      draft.setGallery((g) => [...g, dataUrl].slice(0, GALLERY_MAX))
    }

    const kind: ImagePresetName = target === 'logo' ? 'logo' : target === 'cover' ? 'banner' : 'product'
    setUploading((n) => n + 1)
    try {
      const r = await uploadBlob(blob, kind, dataUrl)
      if (!r.stored) {
        setUploadErr('A imagem não subiu para o servidor de fotos. Ela fica salva assim mesmo, mas mais pesada.')
        return
      }
      // So troca se a imagem ainda e a que acabou de subir (a folha pode ter sido fechada).
      if (target === 'logo') draft.setLogoUrl((cur) => (cur === dataUrl ? r.value : cur))
      else if (target === 'cover') draft.setCoverUrl((cur) => (cur === dataUrl ? r.value : cur))
      else {
        draft.setGallery((g) => g.map((x) => (x === dataUrl ? r.value : x)))
        draft.moveGalleryPro(dataUrl, r.value)
      }
    } catch (e) {
      console.error('[perfil] envio de imagem', e)
      setUploadErr('Não foi possível enviar a imagem. Tente outra vez.')
    } finally {
      setUploading((n) => n - 1)
    }
  }

  function setTheme<K extends keyof BusinessTheme>(k: K, v: BusinessTheme[K]) {
    draft.setTheme((t) => ({ ...t, [k]: v }))
  }
  function applyPreset(p: ThemePreset) {
    draft.setTheme((t) => ({ ...t, primary: p.primary, bg: p.bg, surface: p.surface, onPrimary: 'auto' }))
  }

  /* ---------- resumo de cada cartao ---------- */
  const s = draft.socials
  const redes = [s.whatsapp && 'WhatsApp', s.instagram && s.instagram, s.website && 'Site'].filter(Boolean) as string[]
  const ap = addr.addressParts
  const cidade = [ap.city, ap.state].filter(Boolean).join(' - ')
  const temPino = addr.lat != null && addr.lng != null
  const mapsUrl = temPino ? `https://www.google.com/maps/search/?api=1&query=${addr.lat},${addr.lng}` : null
  const cover = coverBackground(draft.coverUrl, draft.theme.primary)

  const sheetCfg = sheet && sheet !== 'address' && sheet !== 'preview' ? SHEET[sheet] : null
  const saving = sheetCfg ? sheetCfg.sections.some((x) => draft.status[x] === 'saving') : false
  const failed = sheetCfg ? sheetCfg.sections.filter((x) => draft.status[x] === 'error') : []

  const preview = (onSlot?: (s: PreviewSlot) => void) => (
    <BusinessPreview
      businessName={data.name}
      theme={draft.theme}
      logoUrl={draft.logoUrl}
      coverUrl={draft.coverUrl}
      about={draft.about}
      address={addr.address}
      city={ap.city}
      state={ap.state}
      hasPin={temPino}
      socials={draft.socials}
      gallery={draft.gallery}
      galleryPros={draft.galleryPros}
      pros={draft.pros}
      live={live}
      onEditSlot={onSlot}
    />
  )

  return (
    <div className="pf-layout">
      <div className="pf-main">
        <button type="button" className="pf-btn pf-mobile-only" onClick={() => openSheet('preview')}>
          <Eye size={16} aria-hidden /> Ver como o cliente vê
        </button>

        {/* ENDERECO — o mais importante: sem ele o cliente nao acha e o lugar sai do Perto de voce */}
        <h2 className="pf-group">Onde fica</h2>
        <section className="pf-card pf-addr">
          <div className="pf-row-top">
            <span className="pf-tile"><MapPin size={18} aria-hidden /></span>
            <div className="pf-body">
              <div className="pf-cap">Endereço</div>
              {addr.address ? (
                <>
                  <div className="pf-now">{addr.address}</div>
                  <div className="pf-meta">
                    {cidade && <span>{cidade}</span>}
                    {ap.cep && <span>CEP {ap.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}</span>}
                    <span className={temPino ? 'ok' : 'warn'}>{temPino ? 'Pino no mapa' : 'Sem pino no mapa'}</span>
                  </div>
                  {!ap.street && <div className="pf-warnline">Endereço antigo, numa linha só. Atualize em partes para o cliente achar a porta.</div>}
                </>
              ) : (
                <div className="pf-now muted">{cidade ? `Atende em ${cidade}, sem endereço no link.` : 'Nenhum endereço ainda. O cliente não sabe onde fica.'}</div>
              )}
            </div>
            <button type="button" className="pf-act" onClick={() => openSheet('address')}>{addr.address ? 'Mudar' : 'Adicionar'}</button>
          </div>
          {mapsUrl && (
            <a className="pf-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">
              Conferir no Google Maps <ExternalLink size={14} aria-hidden />
            </a>
          )}
        </section>

        <h2 className="pf-group">No seu link</h2>
        <div className="pf-list">
          <Card icon={<Store size={18} />} cap="Logo" onOpen={() => openSheet('logo')} act={draft.logoUrl ? 'Mudar' : 'Enviar'}
            now={draft.logoUrl ? 'Logo enviado' : 'Sem logo: aparecem as iniciais'}
            side={draft.logoUrl
              ? <span className="pf-mini-logo" aria-hidden style={{ backgroundImage: `url("${draft.logoUrl}")` }} />
              : <span className="pf-mini-logo" aria-hidden>{initialsOf(data.name)}</span>} />
          <Card icon={<ImageIcon size={18} />} cap="Capa" onOpen={() => openSheet('cover')} act="Mudar"
            now={coverLabel(draft.coverUrl)}
            side={<span className="pf-mini-cover" style={{ background: cover.background }} aria-hidden />} />
          <Card icon={<AlignLeft size={18} />} cap="Sobre" onOpen={() => openSheet('about')} act={draft.about.trim() ? 'Mudar' : 'Escrever'}
            now={draft.about.trim() ? draft.about.trim().slice(0, 110) + (draft.about.trim().length > 110 ? '…' : '') : 'Vazio. Conte o que torna o atendimento especial.'}
            muted={!draft.about.trim()} />
          <Card icon={<Camera size={18} />} cap="Fotos do espaço" onOpen={() => openSheet('photos')} act={draft.gallery.length ? 'Mudar' : 'Adicionar'}
            now={draft.gallery.length ? `${draft.gallery.length} de ${GALLERY_MAX} fotos` : 'Nenhuma foto. O cliente quer ver o lugar.'}
            muted={!draft.gallery.length}
            side={draft.gallery.length > 0 ? (
              <span className="pf-mini-photos" aria-hidden>
                {draft.gallery.slice(0, 3).map((g, i) => <i key={i} style={{ backgroundImage: `url("${g}")` }} />)}
              </span>
            ) : undefined} />
          <Card icon={<Palette size={18} />} cap="Cores" onOpen={() => openSheet('colors')} act="Mudar"
            now={`${styleLabel(draft.theme.style)} · ${draft.theme.primary.toUpperCase()}`} /* @eligi:cores-resumo-estilo */
            side={<span className="pf-mini-sw" aria-hidden>{[draft.theme.primary, draft.theme.surface, draft.theme.bg].map((c, i) => <i key={i} style={{ background: c }} />)}</span>} />
          <Card icon={<Share2 size={18} />} cap="Redes e contato" onOpen={() => openSheet('socials')} act={redes.length ? 'Mudar' : 'Adicionar'}
            now={redes.length ? redes.join(' · ') : 'Nenhum contato. O cliente não tem como falar com você pelo link.'}
            muted={!redes.length} />
        </div>

        <h2 className="pf-group">Mais</h2>
        <div className="pf-list">
          {discover && <DiscoverCard key={discoverRev} initial={discover} onEditAddress={() => openSheet('address')} />}
          <TimezoneCard initialTimezone={data.timezone} onSaved={() => avisar('Fuso salvo')} />
        </div>
      </div>

      <aside className="pf-side" aria-label="Prévia do link">
        <div className="pf-side-head"><Eye size={15} aria-hidden /> Como o cliente vê <span>toque numa parte para mudar</span></div>
        {preview((slot) => openSheet(SLOT_TO_SHEET[slot]))}
      </aside>

      {sheet === 'address' && (
        <AddressEditor
          initial={addr}
          onClose={() => setSheet(null)}
          onSaved={(v) => {
            setAddr(v)
            draft.setAddress(v.address ?? '')
            setSheet(null)
            avisar(v.address ? 'Endereço salvo' : 'Endereço tirado do link')
            refreshDiscover()
          }}
        />
      )}

      {sheet === 'preview' && (
        <ProfileSheet title="Como o cliente vê" subtitle="Toque numa parte para mudar." onClose={closeSheet} width={460}>
          {preview((slot) => { setSheet(null); openSheet(SLOT_TO_SHEET[slot]) })}
        </ProfileSheet>
      )}

      {sheetCfg && sheet && sheet !== 'address' && sheet !== 'preview' && (
        <ProfileSheet
          title={sheetCfg.title}
          onClose={closeSheet}
          width={sheet === 'photos' || sheet === 'colors' ? 600 : 520}
          footer={
            <>
              {uploadErr && <div className="pf-note warn" role="alert">{uploadErr}</div>}
              {failed.length > 0 && (
                <div className="pf-note warn" role="alert">
                  Não foi possível salvar {failed.map((x) => SECTION_LABEL[x]).join(' e ')}. {draft.errors[failed[0]] ?? ''} Tente de novo.
                </div>
              )}
              <button type="button" className="pf-save" onClick={() => void saveSheet(sheet)} disabled={saving || uploading > 0}>
                {saving ? <><Loader2 size={17} className="addr-spin" aria-hidden /> Salvando…</>
                  : uploading > 0 ? <><Loader2 size={17} className="addr-spin" aria-hidden /> Enviando imagem…</>
                    : sheetCfg.save}
              </button>
            </>
          }
        >
          {sheet === 'logo' && (
            <LogoEditor logoUrl={draft.logoUrl} initials={initialsOf(data.name)} extracted={extracted} primary={draft.theme.primary}
              onPick={openCrop} onRemove={() => draft.setLogoUrl(null)} onPickColor={(c) => setTheme('primary', c)} />
          )}
          {sheet === 'cover' && (
            <CoverEditor coverUrl={draft.coverUrl} primary={draft.theme.primary} onPick={openCrop} onPreset={(v) => draft.setCoverUrl(v)} />
          )}
          {sheet === 'about' && <AboutEditor value={draft.about} onChange={draft.setAbout} />}
          {sheet === 'colors' && <ColorsEditor theme={draft.theme} readability={readability} onSet={setTheme} onPreset={applyPreset} />}
          {sheet === 'photos' && (
            <PhotosEditor gallery={draft.gallery} pros={draft.pros} galleryPros={draft.galleryPros} selected={photoSel} onSelect={setPhotoSel}
              onPick={openCrop} onRemove={(i) => draft.setGallery((arr) => arr.filter((_, j) => j !== i))} onSetPro={draft.setGalleryPro} />
          )}
          {sheet === 'socials' && (
            <SocialsEditor socials={draft.socials} errors={socErr}
              onChange={(k, v) => { draft.setSocials((x) => ({ ...x, [k]: v })); if (socErr[k]) setSocErr((e) => ({ ...e, [k]: undefined })) }}
              onBlurNormalize={(k) => {
                if (k === 'instagram') draft.setSocials((x) => ({ ...x, instagram: normalizeInstagram(x.instagram ?? '') }))
                if (k === 'website') draft.setSocials((x) => ({ ...x, website: normalizeWebsite(x.website ?? '') }))
              }} />
          )}
        </ProfileSheet>
      )}

      {crop && (
        <ImageCropper
          src={crop.src}
          aspect={crop.aspect}
          outWidth={crop.outW}
          outHeight={crop.outH}
          outType="image/webp"
          title={crop.target === 'logo' ? 'Recortar logo' : crop.target === 'cover' ? 'Recortar capa' : 'Recortar foto'}
          onCancel={() => { URL.revokeObjectURL(crop.src); setCrop(null) }}
          onApply={(d, b) => void applyCrop(d, b)}
        />
      )}

      {toast && <div className="pf-toast" role="status">{toast}</div>}
    </div>
  )
}

function Card({ icon, cap, now, act, onOpen, side, muted }: {
  icon: React.ReactNode; cap: string; now: string; act: string; onOpen: () => void; side?: React.ReactNode; muted?: boolean
}) {
  return (
    <button type="button" className="pf-card pf-cardbtn" onClick={onOpen}>
      <span className="pf-tile" aria-hidden>{icon}</span>
      <span className="pf-body">
        <span className="pf-cap">{cap}</span>
        <span className={`pf-now${muted ? ' muted' : ''}`}>{now}</span>
      </span>
      {side}
      <span className="pf-act-txt">{act}<ChevronRight size={16} aria-hidden /></span>
    </button>
  )
}
