'use client';

// src/features/settings/components/ProfileThemeEditor.tsx
//
// Editor de Aparência do Perfil Público — 4 abas:
//   Identidade · Perfil · Equipe & Fotos · Cores
// Tudo recebido via props do parent (sem GET extra). Salva em vários endpoints.

import { useMemo, useState } from 'react';
import {
  UploadCloud, Check, AlertTriangle, Loader2, Palette, Save,
  Image as ImageIcon, Trash2, Instagram, Phone, Globe, Users,
} from 'lucide-react';
import {
  type BusinessTheme,
  type WallPattern,
  type BusinessSocials,
  THEME_PRESETS,
  COVER_PRESETS,
  bestTextOn,
  checkReadability,
  coverBackground,
} from '@/shared/profileTheme';
// @eligi:editor-consome-draft-hook
// `api` e `sanitizeTheme` sairam daqui: quem fala com a API e quem sanitiza o
// tema inicial agora e' o hook. Import orfao e' erro no lint.
import { useBusinessProfileDraft, SECTION_LABEL } from '../hooks/useBusinessProfileDraft';
import { uploadBlob } from '@/shared/utils/uploadImage';
import type { ImagePresetName } from '@/shared/utils/imageCompress';
import ImageCropper from './ImageCropper';
import MapPicker from './MapPicker';
// @eligi:editor-usa-business-preview
// deriveTheme e isMonogramCover sairam daqui junto com a funcao Preview local:
// quem deriva as CSS vars e le o monograma agora e' o BusinessPreview.
import BusinessPreview from './BusinessPreview';

// @eligi:settings-base-no-hook — a base da API vive em useBusinessProfileDraft.

if (typeof document !== 'undefined' && !document.getElementById('eligi-spin-kf')) {
  const s = document.createElement('style');
  s.id = 'eligi-spin-kf';
  s.textContent = '@keyframes eligi-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(s);
}

/* ---------- extração de cores (client-only) ---------- */
function extractPalette(img: HTMLImageElement, count = 6): string[] {
  const cv = document.createElement('canvas');
  const w = (cv.width = 84);
  const h = (cv.height = Math.max(1, Math.round(84 * img.height / img.width)) || 84);
  const ctx = cv.getContext('2d');
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 120) continue;
    const k = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const o = buckets.get(k) ?? { r: 0, g: 0, b: 0, n: 0 };
    o.r += r; o.g += g; o.b += b; o.n++;
    buckets.set(k, o);
  }
  const arr = Array.from(buckets.values()).map(o => {
    const r = Math.round(o.r / o.n), g = Math.round(o.g / o.n), b = Math.round(o.b / o.n);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const sat = mx === 0 ? 0 : (mx - mn) / mx;
    return { r, g, b, score: o.n * (0.3 + sat * 1.4) };
  });
  arr.sort((a, b) => b.score - a.score);
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  const out: Array<{ r: number; g: number; b: number }> = [];
  for (const o of arr) {
    const distinct = out.every(p => Math.abs(p.r - o.r) + Math.abs(p.g - o.g) + Math.abs(p.b - o.b) > 70);
    if (distinct) { out.push(o); if (out.length >= count) break; }
  }
  return out.map(o => `#${hex(o.r)}${hex(o.g)}${hex(o.b)}`);
}

const WALLS: Array<{ id: WallPattern; label: string }> = [
  { id: 'none', label: 'Liso' },
  { id: 'dots', label: 'Pontos' },
  { id: 'grid', label: 'Grade' },
];

type TabId = 'id' | 'perfil' | 'equipe' | 'cores';
const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'id', label: 'Identidade' },
  { id: 'perfil', label: 'Perfil' },
  { id: 'equipe', label: 'Equipe & Fotos' },
  { id: 'cores', label: 'Cores' },
];

type CropState = {
  src: string;
  aspect: number;
  outW: number;
  outH: number;
  // @eligi:cropstate-webp — precisa espelhar a prop `outType` do ImageCropper.
  // Sao DUAS declaracoes do mesmo contrato; ampliar uma sem a outra quebra o build.
  type: 'image/png' | 'image/jpeg' | 'image/webp';
  target: 'logo' | 'cover' | 'gallery';
} | null;

interface Props {
  businessName?: string;
  initialTheme?: Partial<BusinessTheme> | null;
  initialLogo?: string | null;
  initialCover?: string | null;
  initialAbout?: string | null;
  initialAddress?: string | null;
  initialLat?: number | null;
  initialLng?: number | null;
  initialSocials?: BusinessSocials | null;
  initialGallery?: string[] | null;
  onSaved?: (theme: BusinessTheme) => void;
}

// @eligi:initials-movida — agora vive em BusinessPreview.tsx como initialsOf().

export function ProfileThemeEditor({
  businessName = 'Seu negócio',
  initialTheme, initialLogo, initialCover,
  initialAbout, initialAddress, initialLat, initialLng, initialSocials, initialGallery,
  onSaved,
}: Props) {
  // Estado puramente de UI fica aqui; o rascunho persistivel vive no hook.
  const [tab, setTab] = useState<TabId>('id');
  const [extracted, setExtracted] = useState<string[]>([]);
  const [crop, setCrop] = useState<CropState>(null);
  const [saved, setSaved] = useState(false);

  // @eligi:estado-no-draft-hook
  const {
    theme, setTheme,
    logoUrl, setLogoUrl,
    coverUrl, setCoverUrl,
    about, setAbout,
    address, setAddress,
    lat, setLat,
    lng, setLng,
    socials, setSocials,
    gallery, setGallery,
    errors, busy, failed, saveAll,
  } = useBusinessProfileDraft({
    theme: initialTheme,
    logo: initialLogo,
    cover: initialCover,
    about: initialAbout,
    address: initialAddress,
    lat: initialLat,
    lng: initialLng,
    socials: initialSocials,
    gallery: initialGallery,
  });

  // @eligi:vars-no-preview — as CSS vars sao derivadas dentro do BusinessPreview.
  const readability = useMemo(() => checkReadability(theme), [theme]);
  const onPrimaryResolved = theme.onPrimary === 'auto' ? bestTextOn(theme.primary) : theme.onPrimary;

  function touch() { setSaved(false); }
  function set<K extends keyof BusinessTheme>(key: K, value: BusinessTheme[K]) {
    touch();
    setTheme(t => ({ ...t, [key]: value }));
  }
  function applyPreset(p: (typeof THEME_PRESETS)[number]) {
    touch();
    setTheme(t => ({ ...t, primary: p.primary, bg: p.bg, surface: p.surface, onPrimary: 'auto' }));
  }
  function setSocial(key: keyof BusinessSocials, value: string) {
    touch();
    setSocials(s => ({ ...s, [key]: value }));
  }

  function openCrop(file: File, target: 'logo' | 'cover' | 'gallery') {
    const src = URL.createObjectURL(file);
    // @eligi:crop-targets-webp
    // PNG 512x512 sem compressao gerou os 692 kB do logo da Barbearia Will.
    // Mesmas dimensoes em WebP: ~30 kB.
    if (target === 'logo') setCrop({ src, aspect: 1, outW: 512, outH: 512, type: 'image/webp', target });
    else if (target === 'cover') setCrop({ src, aspect: 16 / 9, outW: 1200, outH: 675, type: 'image/webp', target });
    else setCrop({ src, aspect: 1, outW: 800, outH: 800, type: 'image/webp', target });
  }

  // @eligi:apply-crop-upload
  // ORDEM IMPORTA: a paleta e' extraida do dataUrl LOCAL antes do upload.
  // extractPalette usa ctx.getImageData(); imagem carregada de URL cross-origin
  // deixa o canvas tainted e getImageData lanca SecurityError — a cor primaria
  // do tema pararia de ser detectada.
  async function applyCrop(dataUrl: string, blob: Blob) {
    const target = crop?.target;
    const src = crop?.src;
    touch();

    // 1) preview otimista + paleta, tudo com o dataUrl local
    if (target === 'logo') {
      setLogoUrl(dataUrl);
      const img = new Image();
      img.onload = () => {
        const cols = extractPalette(img, 6);
        setExtracted(cols);
        if (cols[0]) setTheme(t => ({ ...t, primary: cols[0], onPrimary: 'auto' }));
      };
      img.src = dataUrl;
    } else if (target === 'cover') {
      setCoverUrl(dataUrl);
    } else if (target === 'gallery') {
      setGallery(g => [...g, dataUrl].slice(0, 3));
    }

    if (src) URL.revokeObjectURL(src);
    setCrop(null);

    // 2) upload em segundo plano; a URL substitui o base64 quando chega.
    //    Falhou? o dataUrl fica — degrada pro comportamento anterior.
    if (!target) return;

    const kind: ImagePresetName =
      target === 'logo' ? 'logo' : target === 'cover' ? 'banner' : 'product';

    const result = await uploadBlob(blob, kind, dataUrl);
    if (!result.stored) return;

    if (target === 'logo') {
      setLogoUrl(result.value);
    } else if (target === 'cover') {
      setCoverUrl(result.value);
    } else {
      // Troca pela URL a entrada que acabou de ser inserida (comparando pelo
      // dataUrl), sem depender de indice — o usuario pode ter removido outra
      // foto enquanto o upload corria.
      setGallery(g => g.map(item => (item === dataUrl ? result.value : item)));
    }
  }

  // @eligi:save-delega-ao-hook
  // O selo "Salvo" so' aparece se as QUATRO secoes passarem. Antes, o encadeado
  // sem catch marcava sucesso mesmo com metade da tela por gravar.
  async function save() {
    const ok = await saveAll();
    if (!ok) return;
    setSaved(true);
    onSaved?.(theme);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 400px) 1fr', gap: 22, alignItems: 'start' }}>
      {/* ---------- CONTROLES ---------- */}
      <div style={card}>
        {/* abas */}
        <div style={{ display: 'flex', gap: 2, background: '#f1f1f4', borderRadius: 11, padding: 4, marginBottom: 16, overflow: 'auto' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, whiteSpace: 'nowrap', padding: '9px 10px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                background: tab === t.id ? '#fff' : 'transparent',
                color: tab === t.id ? '#0c0c12' : '#71717a',
                boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* IDENTIDADE */}
        {tab === 'id' && (
          <div>
            <div style={glabel}>Nome (herdado do cadastro)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#f1f1f4', borderRadius: 11, padding: '11px 13px' }}>
              <b style={{ fontSize: 14 }}>{businessName}</b>
              <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, color: '#047857', background: '#e9f7f1', padding: '3px 8px', borderRadius: 99 }}>herdado</span>
            </div>

            <div style={glabel}>Logo · extrai as cores ao subir</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <label style={{ width: 52, height: 52, borderRadius: 13, border: '1.5px dashed #e7e7ec', display: 'grid', placeItems: 'center', overflow: 'hidden', cursor: 'pointer', color: '#a1a1aa', flex: 'none', background: '#fafafa' }}>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : <ImageIcon size={18} />}
                <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) openCrop(f, 'logo'); e.target.value = ''; }} />
              </label>
              <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.4 }}>
                Ao subir, abrimos o <b style={{ color: '#0c0c12' }}>recortador</b> e extraímos a paleta.
              </div>
              {logoUrl && (
                <button onClick={() => { touch(); setLogoUrl(null); }} style={miniBtn} aria-label="Remover logo"><Trash2 size={14} /></button>
              )}
            </div>
            {extracted.length > 0 && (
              <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
                {extracted.map(c => (
                  <button key={c} onClick={() => set('primary', c)} title={c}
                    style={{ width: 30, height: 30, borderRadius: 8, background: c, cursor: 'pointer', boxShadow: '0 0 0 1px #e7e7ec', border: theme.primary === c ? '2px solid #0c0c12' : '2px solid #fff' }} />
                ))}
              </div>
            )}

            <div style={glabel}>Capa do painel</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {COVER_PRESETS.map(id => {
                const sel = coverUrl === `preset:${id}` || (!coverUrl && id === 'gradient');
                const label = id === 'monogram' ? 'Monograma' : id === 'glow' ? 'Brilho' : 'Gradiente';
                return (
                  <button key={id} onClick={() => { touch(); setCoverUrl(`preset:${id}`); }}
                    style={{ height: 50, borderRadius: 10, background: coverBackground(`preset:${id}`, theme.primary).background, border: sel ? '2px solid #0c0c12' : '2px solid transparent', boxShadow: '0 0 0 1px #e7e7ec', cursor: 'pointer', color: '#fff', fontSize: 11.5, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,.5)' }}>
                    {label}
                  </button>
                );
              })}
              <label style={{ height: 50, borderRadius: 10, cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 600, color: coverUrl?.startsWith('data:') ? '#fff' : '#71717a', border: coverUrl?.startsWith('data:') ? '2px solid #0c0c12' : '1.5px dashed #e7e7ec', background: coverUrl?.startsWith('data:') ? `linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.4)), url("${coverUrl}") center/cover` : 'transparent', textShadow: coverUrl?.startsWith('data:') ? '0 1px 4px rgba(0,0,0,.6)' : 'none' }}>
                {coverUrl?.startsWith('data:') ? 'Trocar foto' : 'Subir foto'}
                <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) openCrop(f, 'cover'); e.target.value = ''; }} />
              </label>
            </div>
          </div>
        )}

        {/* PERFIL */}
        {tab === 'perfil' && (
          <div>
            <div style={glabel}>Sobre nós</div>
            <textarea value={about} onChange={e => { touch(); setAbout(e.target.value); }} placeholder="Conte a história do lugar, o que torna o atendimento especial..."
              style={{ width: '100%', minHeight: 84, resize: 'vertical', border: '1px solid #e7e7ec', borderRadius: 11, padding: 11, fontFamily: 'inherit', fontSize: 13, color: '#0c0c12' }} maxLength={1500} />
            <div style={{ fontSize: 11, color: '#a1a1aa', textAlign: 'right', marginTop: 4 }}>{about.length}/1500</div>

            <div style={glabel}>Endereço</div>
            <input value={address} onChange={e => { touch(); setAddress(e.target.value); }} placeholder="Rua, número — bairro, cidade - UF" style={inp} />
            <div style={{ marginTop: 8 }}>
              <MapPicker lat={lat} lng={lng} address={address} onChange={(la, ln) => { touch(); setLat(la); setLng(ln); }} />
            </div>

            <div style={glabel}>Redes sociais</div>
            <SocialInput icon={<Instagram size={15} />} value={socials.instagram ?? ''} onChange={v => setSocial('instagram', v)} placeholder="@seuperfil" />
            <SocialInput icon={<Phone size={15} />} value={socials.whatsapp ?? ''} onChange={v => setSocial('whatsapp', v)} placeholder="WhatsApp — (11) 9...." />
            <SocialInput icon={<Globe size={15} />} value={socials.website ?? ''} onChange={v => setSocial('website', v)} placeholder="https://seusite.com.br" />
          </div>
        )}

        {/* EQUIPE & FOTOS */}
        {tab === 'equipe' && (
          <div>
            <div style={glabel}>Equipe</div>
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: '#f7f7f9', border: '1px solid #eee', borderRadius: 12, padding: '12px 14px', fontSize: 12.5, color: '#52525b', lineHeight: 1.45 }}>
              <Users size={16} style={{ flex: 'none', marginTop: 1, color: '#71717a' }} />
              <span>A equipe aparece automaticamente no link, com os avatares dos <b>profissionais com agendamento online</b>. Edite quem aparece em <b>Equipe</b>.</span>
            </div>

            <div style={glabel}>Fotos do estabelecimento <span style={{ color: '#a1a1aa', fontWeight: 600 }}>· até 3</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {gallery.map((g, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 11, overflow: 'hidden', boxShadow: '0 0 0 1px #e7e7ec' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => { touch(); setGallery(arr => arr.filter((_, j) => j !== i)); }} aria-label="Remover foto"
                    style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(12,12,18,.7)', color: '#fff', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {gallery.length < 3 && (
                <label style={{ aspectRatio: '1', borderRadius: 11, border: '1.5px dashed #e7e7ec', display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#a1a1aa' }}>
                  <UploadCloud size={18} />
                  <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) openCrop(f, 'gallery'); e.target.value = ''; }} />
                </label>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 8 }}>Cada foto passa pelo recortador (quadrada).</div>
          </div>
        )}

        {/* CORES */}
        {tab === 'cores' && (
          <div>
            <div style={glabel}>Modelos prontos</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9 }}>
              {THEME_PRESETS.map(p => {
                const on = theme.primary === p.primary && theme.bg === p.bg;
                return (
                  <button key={p.id} onClick={() => applyPreset(p)}
                    style={{ border: on ? '1.5px solid #dc2626' : '1.5px solid #e7e7ec', boxShadow: on ? '0 0 0 3px #fff5f5' : 'none', borderRadius: 13, padding: 9, textAlign: 'left', cursor: 'pointer', background: '#fff' }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 7 }}>
                      {[p.primary, p.surface, p.bg].map((c, i) => (
                        <i key={i} style={{ width: 15, height: 15, borderRadius: 5, background: c, boxShadow: 'inset 0 0 0 1px #e7e7ec', display: 'block' }} />
                      ))}
                    </div>
                    <small style={{ fontSize: 11.5, fontWeight: 700, color: '#3a3a44' }}>{p.label}</small>
                  </button>
                );
              })}
            </div>

            <div style={glabel}>Ajuste fino</div>
            <Field label="Cor principal" sub="Botão · destaques · selects">
              <ColorInput value={theme.primary} onChange={v => set('primary', v)} />
            </Field>
            <Field label="Texto do botão" sub="Auto por contraste">
              <ColorInput value={onPrimaryResolved} code={theme.onPrimary === 'auto' ? `auto · ${onPrimaryResolved}` : onPrimaryResolved} onChange={v => set('onPrimary', v)} />
            </Field>
            <Field label="Cor dos cards" sub="Superfície dos blocos">
              <ColorInput value={theme.surface} onChange={v => set('surface', v)} />
            </Field>

            <div style={glabel}>Fundo / papel de parede</div>
            <Field label="Cor de fundo">
              <ColorInput value={theme.bg} onChange={v => set('bg', v)} />
            </Field>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {WALLS.map(w => (
                <button key={w.id} onClick={() => set('wall', w.id)}
                  style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: theme.wall === w.id ? '1.5px solid #dc2626' : '1.5px solid #e7e7ec', boxShadow: theme.wall === w.id ? '0 0 0 3px #fff5f5' : 'none', color: '#3a3a44', background: '#fff' }}>
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* guard-rail + salvar (sempre visível) */}
        <div style={{ paddingTop: 18, marginTop: 12, borderTop: '1px solid #f1f1f4' }}>
          {readability.ok ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#047857', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              <Check size={15} /> Paleta legível e dentro do padrão.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 11, padding: '10px 12px', fontSize: 12, fontWeight: 600, marginBottom: 12, lineHeight: 1.4 }}>
              <AlertTriangle size={15} style={{ flex: 'none', marginTop: 1 }} />
              <span>Contraste baixo no botão ({readability.ratio.toFixed(1)}:1). Sugerimos texto {readability.suggestedOnPrimary === '#ffffff' ? 'branco' : 'escuro'}.</span>
            </div>
          )}
          {/* @eligi:falha-de-save-visivel
              Erro por secao. Nomeia o que NAO foi gravado: "nao salvou" sem
              dizer o que e' pior que nao avisar, porque manda reconferir tudo. */}
          {failed.length > 0 && (
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 11, padding: '10px 12px', fontSize: 12, fontWeight: 600, marginBottom: 12, lineHeight: 1.45 }}>
              <AlertTriangle size={15} style={{ flex: 'none', marginTop: 1 }} />
              <span>
                Não foi possível salvar {failed.map(s => SECTION_LABEL[s]).join(', ')}.
                {errors[failed[0]] ? ` ${errors[failed[0]]}.` : ''} O restante foi gravado.
                Tente de novo.
              </span>
            </div>
          )}
          <button onClick={save} disabled={busy}
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 12, padding: '13px 18px', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1, border: 'none' }}>
            {busy ? <Loader2 size={16} style={{ animation: 'eligi-spin 1s linear infinite' }} /> : saved ? <Check size={16} /> : <Save size={16} />}
            {busy ? 'Salvando…' : saved ? 'Salvo' : 'Salvar personalização'}
          </button>
        </div>
      </div>

      {/* ---------- PREVIEW ---------- */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#71717a', fontSize: 13, fontWeight: 600 }}>
          <Palette size={15} /> Preview ao vivo
        </div>
        {/* @eligi:render-business-preview */}
        <BusinessPreview
          businessName={businessName}
          theme={theme}
          logoUrl={logoUrl}
          coverUrl={coverUrl}
          about={about}
          address={address}
          socials={socials}
          gallery={gallery}
        />
      </div>

      {/* ---------- RECORTADOR ---------- */}
      {crop && (
        <ImageCropper
          src={crop.src}
          aspect={crop.aspect}
          outWidth={crop.outW}
          outHeight={crop.outH}
          outType={crop.type}
          title={crop.target === 'logo' ? 'Recortar logo (1:1)' : crop.target === 'cover' ? 'Recortar capa (16:9)' : 'Recortar foto (1:1)'}
          onCancel={() => { if (crop.src) URL.revokeObjectURL(crop.src); setCrop(null); }}
          onApply={applyCrop}
        />
      )}
    </div>
  );
}

// @eligi:preview-local-removida — virou src/features/settings/components/BusinessPreview.tsx

/* ---------- subcomponentes ---------- */
function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 0' }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0c0c12' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#71717a', fontWeight: 500 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function ColorInput({ value, code, onChange }: { value: string; code?: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <label style={{ width: 34, height: 34, borderRadius: 9, border: '2px solid #fff', boxShadow: '0 0 0 1px #e7e7ec', overflow: 'hidden', cursor: 'pointer', position: 'relative', background: value }}>
        <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#dc2626'} onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', inset: -6, width: '150%', height: '150%', border: 'none', padding: 0, cursor: 'pointer', background: 'none' }} />
      </label>
      <code style={{ fontSize: 11.5, color: '#71717a', fontWeight: 600, minWidth: 70 }}>{code ?? value}</code>
    </div>
  );
}

function SocialInput({ icon, value, onChange, placeholder }: { icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0' }}>
      <span style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f1f4', display: 'grid', placeItems: 'center', color: '#52525b', flex: 'none' }}>{icon}</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...inp, marginTop: 0 }} />
    </div>
  );
}

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e7e7ec',
  borderRadius: 20,
  boxShadow: '0 1px 2px rgba(12,12,18,.04),0 14px 36px -16px rgba(12,12,18,.18)',
  padding: 18,
};

const glabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '.06em', margin: '16px 0 8px',
};

const inp: React.CSSProperties = {
  width: '100%', border: '1px solid #e7e7ec', borderRadius: 11, padding: 11, fontFamily: 'inherit', fontSize: 13, color: '#0c0c12',
};

const miniBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8, border: '1px solid #e7e7ec', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#71717a', flex: 'none', marginLeft: 'auto',
};

export default ProfileThemeEditor;
