'use client'
// src/app/dashboard/configuracoes/empresa/components/ProfileEditors.tsx
// @eligi:perfil-editores — o miolo de cada folha de Perfil e endereco.
// Componentes controlados: o rascunho mora no useBusinessProfileDraft (pagina).

import { Check, ImagePlus, Instagram, Globe, Phone, Trash2, Upload, User } from 'lucide-react'
import {
  COVER_PRESETS,
  coverBackground,
  isPhotoCover,
  type BusinessSocials,
  type BusinessTheme,
  type ThemePreset,
  type ReadabilityCheck,
} from '@/shared/profileTheme'
import { ColorsFields } from '@/features/settings/components/ProfileFields'
import type { GalleryPro } from '@/features/settings/hooks/useBusinessProfileDraft'

export type CropTarget = 'logo' | 'cover' | 'gallery'
export const GALLERY_MAX = 12 // espelha GALLERY_MAX do back (shared/theme)
export const ABOUT_MAX = 1500 // espelha sanitizeAbout do back

function FilePick({ label, target, onPick, className = 'pf-btn' }: {
  label: string; target: CropTarget; onPick: (f: File, t: CropTarget) => void; className?: string
}) {
  return (
    <label className={className}>
      <Upload size={16} aria-hidden />
      {label}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f, target); e.target.value = '' }}
      />
    </label>
  )
}

/* ---------- LOGO ---------- */
export function LogoEditor({ logoUrl, initials, extracted, primary, onPick, onRemove, onPickColor }: {
  logoUrl: string | null
  initials: string
  extracted: string[]
  primary: string
  onPick: (f: File, t: CropTarget) => void
  onRemove: () => void
  onPickColor: (hex: string) => void
}) {
  return (
    <div>
      <div className="pf-logo-row">
        <span className="pf-logo-big" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logoUrl ? <img src={logoUrl} alt="" /> : <b>{initials}</b>}
        </span>
        <div style={{ minWidth: 0 }}>
          <p className="pf-p">{logoUrl ? 'Este é o logo do seu link.' : 'Sem logo, o link mostra as iniciais.'} Ele vira o ícone do app do cliente e sai no recibo e na nota fiscal.</p>
          <div className="pf-row">
            <FilePick label={logoUrl ? 'Trocar logo' : 'Enviar logo'} target="logo" onPick={onPick} className="pf-btn ink" />
            {logoUrl && (
              <button type="button" className="pf-btn" onClick={onRemove}><Trash2 size={16} aria-hidden /> Tirar</button>
            )}
          </div>
        </div>
      </div>
      <p className="pf-help">JPG, PNG ou WebP. Você recorta em quadrado depois de escolher.</p>
      {extracted.length > 0 && (
        <div className="pf-block">
          <span className="pf-lb">Cores do seu logo</span>
          <p className="pf-help" style={{ marginTop: 0 }}>Tocar escolhe a cor principal do link.</p>
          <div className="pf-row">
            {extracted.map((c) => (
              <button key={c} type="button" className="pf-swatch" aria-pressed={primary === c} aria-label={`Usar a cor ${c}`} onClick={() => onPickColor(c)} style={{ background: c }}>
                {primary === c && <Check size={16} color="#fff" aria-hidden />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- CAPA ---------- */
const COVER_LABEL: Record<string, string> = { gradient: 'Gradiente', glow: 'Brilho', monogram: 'Monograma' }

export function coverLabel(coverUrl: string | null): string {
  if (isPhotoCover(coverUrl)) return 'Foto'
  const id = coverUrl?.startsWith('preset:') ? coverUrl.slice(7) : 'gradient'
  return COVER_LABEL[id] ?? 'Gradiente'
}

export function CoverEditor({ coverUrl, primary, onPick, onPreset }: {
  coverUrl: string | null; primary: string
  onPick: (f: File, t: CropTarget) => void; onPreset: (v: string) => void
}) {
  const photo = isPhotoCover(coverUrl)
  return (
    <div>
      <p className="pf-p">A faixa do topo do seu link. Use uma foto do espaço ou um fundo pronto na sua cor.</p>
      <div className="pf-cover-grid">
        {COVER_PRESETS.map((id) => {
          const v = `preset:${id}`
          const sel = coverUrl === v || (!coverUrl && id === 'gradient')
          return (
            <button key={id} type="button" className="pf-cover" aria-pressed={sel} onClick={() => onPreset(v)}
              style={{ background: coverBackground(v, primary).background }}>
              <span>{COVER_LABEL[id]}</span>
              {sel && <i aria-hidden><Check size={14} /></i>}
            </button>
          )
        })}
        <label className="pf-cover photo" data-on={photo ? 'true' : undefined}
          style={photo && coverUrl ? { background: coverBackground(coverUrl, primary).background } : undefined}>
          <span><ImagePlus size={16} aria-hidden /> {photo ? 'Trocar foto' : 'Enviar foto'}</span>
          {photo && <i aria-hidden><Check size={14} /></i>}
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f, 'cover'); e.target.value = '' }} />
        </label>
      </div>
      <p className="pf-help">A foto é recortada em 16:9. Prefira foto clara do espaço, sem texto.</p>
    </div>
  )
}

/* ---------- SOBRE ---------- */
export function AboutEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const left = ABOUT_MAX - value.length
  return (
    <div>
      <label className="pf-fld">
        <span className="pf-lb">Sobre o estabelecimento</span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, ABOUT_MAX))}
          rows={6}
          placeholder="Conte o que torna o atendimento especial: há quanto tempo existe, o que vocês fazem melhor, se tem estacionamento, café, acessibilidade…"
        />
      </label>
      <p className="pf-help pf-count" aria-live="polite">{left < 200 ? `Faltam ${left} caracteres` : `${value.length}/${ABOUT_MAX}`}</p>
      <p className="pf-help">Aparece logo abaixo do nome no seu link. Duas ou três frases bastam.</p>
    </div>
  )
}

/* ---------- REDES ---------- */
export type SocialErrors = Partial<Record<keyof BusinessSocials, string>>

/** "@perfil" a partir de @perfil, perfil ou instagram.com/perfil. */
export function normalizeInstagram(v: string): string {
  const t = v.trim()
  if (!t) return ''
  const m = t.match(/instagram\.com\/([A-Za-z0-9._]+)/i)
  const handle = (m ? m[1] : t).replace(/^@+/, '').replace(/\/+$/, '')
  return handle ? `@${handle}` : ''
}

export function normalizeWebsite(v: string): string {
  const t = v.trim()
  if (!t) return ''
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

/** Erros dos campos de redes (o que o cliente toca no link precisa funcionar). */
export function socialErrors(s: BusinessSocials): SocialErrors {
  const e: SocialErrors = {}
  const ig = (s.instagram ?? '').trim()
  if (ig && !/^@[A-Za-z0-9._]{1,30}$/.test(normalizeInstagram(ig))) e.instagram = 'Use só o nome do perfil, ex.: @suabarbearia.'
  const wa = (s.whatsapp ?? '').replace(/\D/g, '')
  if (wa && !(wa.length === 10 || wa.length === 11 || ((wa.length === 12 || wa.length === 13) && wa.startsWith('55')))) {
    e.whatsapp = 'Use DDD + número, ex.: (11) 91234-5678.'
  }
  const site = (s.website ?? '').trim()
  if (site) {
    try {
      const u = new URL(normalizeWebsite(site))
      if (!u.hostname.includes('.')) e.website = 'Endereço de site incompleto.'
    } catch {
      e.website = 'Endereço de site inválido.'
    }
  }
  return e
}

export function SocialsEditor({ socials, errors, onChange, onBlurNormalize }: {
  socials: BusinessSocials
  errors: SocialErrors
  onChange: (k: keyof BusinessSocials, v: string) => void
  onBlurNormalize: (k: keyof BusinessSocials) => void
}) {
  const row = (k: keyof BusinessSocials, icon: React.ReactNode, label: string, placeholder: string, inputMode: 'text' | 'tel' | 'url') => (
    <label className="pf-fld" key={k}>
      <span className="pf-lb">{label}</span>
      <span className="pf-iconinput">
        <span aria-hidden>{icon}</span>
        <input
          value={socials[k] ?? ''}
          onChange={(e) => onChange(k, e.target.value)}
          onBlur={() => onBlurNormalize(k)}
          placeholder={placeholder}
          inputMode={inputMode}
          autoCapitalize="none"
          autoCorrect="off"
          aria-invalid={errors[k] ? true : undefined}
          aria-describedby={errors[k] ? `soc-${k}-e` : undefined}
        />
      </span>
      {errors[k] && <span className="pf-err" id={`soc-${k}-e`} role="alert">{errors[k]}</span>}
    </label>
  )
  return (
    <div>
      <p className="pf-p">Viram botões no seu link. Deixe em branco o que você não usa.</p>
      {row('whatsapp', <Phone size={16} />, 'WhatsApp', '(11) 91234-5678', 'tel')}
      {row('instagram', <Instagram size={16} />, 'Instagram', '@seuperfil', 'text')}
      {row('website', <Globe size={16} />, 'Site', 'seusite.com.br', 'url')}
    </div>
  )
}

/* ---------- FOTOS ---------- */
export function PhotosEditor({ gallery, pros, galleryPros, selected, onSelect, onPick, onRemove, onSetPro }: {
  gallery: string[]
  pros: GalleryPro[]
  galleryPros: Record<string, string | null>
  selected: number | null
  onSelect: (i: number | null) => void
  onPick: (f: File, t: CropTarget) => void
  onRemove: (i: number) => void
  onSetPro: (url: string, id: string | null) => void
}) {
  const proIds = new Set(pros.map((p) => p.id))
  const sel = selected !== null && selected < gallery.length ? selected : null
  const selUrl = sel !== null ? gallery[sel] : null
  const current = selUrl ? galleryPros[selUrl] ?? null : null
  return (
    <div>
      <p className="pf-p">O cliente vê antes de agendar. Toque numa foto para dizer quem fez ou para tirar.</p>
      <div className="pf-photos">
        {gallery.map((g, i) => {
          const pid = galleryPros[g] ?? null
          const who = pid && proIds.has(pid) ? pros.find((p) => p.id === pid)?.name : null
          return (
            <button key={`${i}-${g.slice(-24)}`} type="button" className="pf-photo" aria-pressed={sel === i}
              aria-label={`Foto ${i + 1}${who ? `, de ${who}` : ''}`} onClick={() => onSelect(sel === i ? null : i)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g} alt="" />
              {who && <span className="pf-photo-who">{who.split(' ')[0]}</span>}
            </button>
          )
        })}
        {gallery.length < GALLERY_MAX && (
          <label className="pf-photo add">
            <ImagePlus size={20} aria-hidden />
            <span>Adicionar</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f, 'gallery'); e.target.value = '' }} />
          </label>
        )}
      </div>
      <p className="pf-help">{gallery.length} de {GALLERY_MAX} fotos. Cada uma é recortada em quadrado.</p>

      {sel !== null && selUrl && (
        <div className="pf-block pf-photo-panel">
          <span className="pf-lb">Foto {sel + 1} · quem fez</span>
          {pros.length > 0 ? (
            <div className="pf-row">
              <button type="button" className="pf-chip" aria-pressed={!current || !proIds.has(current)} onClick={() => onSetPro(selUrl, null)}>
                Ninguém
              </button>
              {pros.map((p) => (
                <button key={p.id} type="button" className="pf-chip" aria-pressed={current === p.id} onClick={() => onSetPro(selUrl, p.id)}>
                  <User size={14} aria-hidden /> {p.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="pf-help" style={{ marginTop: 0 }}>Ninguém da equipe atende pelo link ainda. Quem fez a foto aparece aqui quando houver.</p>
          )}
          <p className="pf-help">Com o nome, o cliente vê de quem é o trabalho e já agenda com essa pessoa.</p>
          <button type="button" className="pf-btn danger" onClick={() => { onRemove(sel); onSelect(null) }}>
            <Trash2 size={16} aria-hidden /> Tirar esta foto
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------- CORES ---------- */
export function ColorsEditor({ theme, readability, onSet, onPreset }: {
  theme: BusinessTheme
  readability: ReadabilityCheck
  onSet: <K extends keyof BusinessTheme>(k: K, v: BusinessTheme[K]) => void
  onPreset: (p: ThemePreset) => void
}) {
  return (
    <div className="pf-colors">
      <p className="pf-p">A cor principal pinta a capa, os botões e o cartão do cliente no seu link.</p>
      <ColorsFields theme={theme} onSet={onSet} onApplyPreset={onPreset} />
      <div className={`pf-note ${readability.ok ? 'ok' : 'warn'}`} role="status">
        {readability.ok
          ? `Contraste ${readability.ratio.toFixed(1)}:1: o texto do botão fica legível.`
          : `Contraste baixo no botão (${readability.ratio.toFixed(1)}:1). Use texto ${readability.suggestedOnPrimary === '#ffffff' ? 'branco' : 'escuro'}.`}
      </div>
    </div>
  )
}
