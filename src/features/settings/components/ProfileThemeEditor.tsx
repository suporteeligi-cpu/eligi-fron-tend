'use client';

// src/features/settings/components/ProfileThemeEditor.tsx
//
// Editor de Aparência do Perfil Público — 4 abas:
//   Identidade · Perfil · Equipe & Fotos · Cores
// Tudo recebido via props do parent (sem GET extra). Salva em vários endpoints.

import { useMemo, useState } from 'react';
import { Check, AlertTriangle, Loader2, Palette, Save } from 'lucide-react';
import {
  type BusinessTheme,
  type BusinessSocials,
  type ThemePreset,
  checkReadability,
} from '@/shared/profileTheme';
// @eligi:editor-compoe-fields
// Os controles de cada assunto agora vivem em ProfileFields.tsx, compartilhados
// com as sheets do mobile. O que sumiu deste import foi junto com eles.
import {
  IdentityFields,
  AboutField,
  AddressField,
  SocialsField,
  TeamAndPhotosFields,
  ColorsFields,
} from './ProfileFields';
// @eligi:editor-consome-draft-hook
// `api` e `sanitizeTheme` sairam daqui: quem fala com a API e quem sanitiza o
// tema inicial agora e' o hook. Import orfao e' erro no lint.
import { useBusinessProfileDraft, SECTION_LABEL } from '../hooks/useBusinessProfileDraft';
import { uploadBlob } from '@/shared/utils/uploadImage';
import type { ImagePresetName } from '@/shared/utils/imageCompress';
import ImageCropper from './ImageCropper';
// @eligi:mappicker-no-address-field — o mapa e' montado dentro de AddressField.
// @eligi:editor-usa-business-preview
// deriveTheme e isMonogramCover sairam daqui junto com a funcao Preview local:
// quem deriva as CSS vars e le o monograma agora e' o BusinessPreview.
import BusinessPreview from './BusinessPreview';
// @eligi:editor-bifurca-mobile-import
import { useIsMobile } from '@/hooks/useIsMobile';
import MobileProfileEditor from './MobileProfileEditor';

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

// @eligi:walls-nos-fields — a lista de papeis de parede vive em ProfileFields.

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

  const isMobile = useIsMobile();

  // @eligi:estado-no-draft-hook
  // @eligi:draft-objeto-nomeado
  // Guardado tambem como objeto: o MobileProfileEditor recebe o rascunho
  // inteiro, em vez de vinte props soltas.
  const draft = useBusinessProfileDraft({
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

  // @eligi:draft-desestrutura
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
  } = draft;

  // @eligi:vars-no-preview — as CSS vars sao derivadas dentro do BusinessPreview.
  const readability = useMemo(() => checkReadability(theme), [theme]);
  // @eligi:onprimary-nos-fields — derivado dentro de ColorsFields.

  function touch() { setSaved(false); }
  function set<K extends keyof BusinessTheme>(key: K, value: BusinessTheme[K]) {
    touch();
    setTheme(t => ({ ...t, [key]: value }));
  }
  // @eligi:applypreset-tipo-nomeado
  // Era `(typeof THEME_PRESETS)[number]`: a constante saiu do import junto com
  // a aba de cores, mas continuava presa aqui pelo TIPO. Quebraria o build.
  function applyPreset(p: ThemePreset) {
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

  // @eligi:branch-mobile
  // O recortador serve as DUAS superficies: declarado uma vez, montado nas duas
  // arvores. Duas copias divergiriam no primeiro ajuste de proporcao.
  const cropper = crop ? (
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
  ) : null;

  if (isMobile) {
    return (
      <>
        <MobileProfileEditor
          businessName={businessName}
          draft={draft}
          extracted={extracted}
          readability={readability}
          onPickFile={openCrop}
          onSetTheme={set}
          onApplyPreset={applyPreset}
          onSetSocial={setSocial}
        />
        {cropper}
      </>
    );
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
        {/* @eligi:aba-id-compoe */}
        {tab === 'id' && (
          <IdentityFields
            businessName={businessName}
            logoUrl={logoUrl}
            coverUrl={coverUrl}
            primary={theme.primary}
            extracted={extracted}
            onPickFile={openCrop}
            onRemoveLogo={() => { touch(); setLogoUrl(null); }}
            onPickExtracted={c => set('primary', c)}
            onPickCoverPreset={v => { touch(); setCoverUrl(v); }}
          />
        )}

        {/* PERFIL */}
        {/* @eligi:aba-perfil-compoe */}
        {tab === 'perfil' && (
          <div>
            <AboutField value={about} onChange={v => { touch(); setAbout(v); }} />
            <AddressField
              address={address}
              lat={lat}
              lng={lng}
              onChangeAddress={v => { touch(); setAddress(v); }}
              onChangeCoords={(la, ln) => { touch(); setLat(la); setLng(ln); }}
            />
            <SocialsField socials={socials} onChange={setSocial} />
          </div>
        )}

        {/* EQUIPE & FOTOS */}
        {/* @eligi:aba-equipe-compoe */}
        {tab === 'equipe' && (
          <TeamAndPhotosFields
            gallery={gallery}
            onPickFile={openCrop}
            onRemovePhoto={i => { touch(); setGallery(arr => arr.filter((_, j) => j !== i)); }}
          />
        )}

        {/* CORES */}
        {/* @eligi:aba-cores-compoe */}
        {tab === 'cores' && (
          <ColorsFields theme={theme} onSet={set} onApplyPreset={applyPreset} />
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

      {/* @eligi:cropper-unico — declarado antes do branch mobile. */}
      {cropper}
    </div>
  );
}

// @eligi:preview-local-removida — virou src/features/settings/components/BusinessPreview.tsx

// @eligi:subcomponentes-nos-fields
// Field, ColorInput e SocialInput vivem em ProfileFields.tsx — as sheets do
// mobile usam os mesmos.

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e7e7ec',
  borderRadius: 20,
  boxShadow: '0 1px 2px rgba(12,12,18,.04),0 14px 36px -16px rgba(12,12,18,.18)',
  padding: 18,
};

// @eligi:estilos-nos-fields — glabel, inp e miniBtn vivem em ProfileFields.tsx.

export default ProfileThemeEditor;
