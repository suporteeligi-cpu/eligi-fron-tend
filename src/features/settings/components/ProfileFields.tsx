'use client';

// src/features/settings/components/ProfileFields.tsx
//
// @eligi:profile-fields-modulo
// Os controles do perfil publico, um componente por assunto.
//
// POR QUE EXISTE
// As abas do desktop e as sheets do mobile editam as MESMAS coisas. Manter dois
// JSX equivalentes garantiria que um dia so' um dos dois receberia a correcao.
// Aqui cada campo e' escrito uma vez e montado nas duas superficies.
//
// CONTRATO: componentes controlados e sem estado proprio. Recebem valor e
// callback; quem guarda o rascunho e' o useBusinessProfileDraft.

import {
  UploadCloud, Trash2, Instagram, Phone, Globe, Users,
  Image as ImageIcon,
} from 'lucide-react';
import {
  type BusinessTheme,
  type WallPattern,
  type BusinessSocials,
  type ThemePreset,
  THEME_PRESETS,
  COVER_PRESETS,
  bestTextOn,
  coverBackground,
} from '@/shared/profileTheme';
import MapPicker from './MapPicker';

export type CropTarget = 'logo' | 'cover' | 'gallery';

const WALLS: Array<{ id: WallPattern; label: string }> = [
  { id: 'none', label: 'Liso' },
  { id: 'dots', label: 'Pontos' },
  { id: 'grid', label: 'Grade' },
];

/* ---------- estilos compartilhados ---------- */

export const glabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '.06em', margin: '16px 0 8px',
};

export const inp: React.CSSProperties = {
  width: '100%', border: '1px solid #e7e7ec', borderRadius: 11, padding: 11, fontFamily: 'inherit', fontSize: 13, color: '#0c0c12',
};

const miniBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8, border: '1px solid #e7e7ec', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#71717a', flex: 'none', marginLeft: 'auto',
};

/* ---------- subcomponentes ---------- */

export function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
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

export function ColorInput({ value, code, onChange }: { value: string; code?: string; onChange: (v: string) => void }) {
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

export function SocialInput({ icon, value, onChange, placeholder }: { icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0' }}>
      <span style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f1f4', display: 'grid', placeItems: 'center', color: '#52525b', flex: 'none' }}>{icon}</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...inp, marginTop: 0 }} />
    </div>
  );
}

/* ---------- IDENTIDADE: nome, logo, capa ---------- */

interface IdentityProps {
  businessName: string;
  logoUrl: string | null;
  coverUrl: string | null;
  primary: string;
  extracted: string[];
  onPickFile: (file: File, target: CropTarget) => void;
  onRemoveLogo: () => void;
  onPickExtracted: (hex: string) => void;
  onPickCoverPreset: (value: string) => void;
  showName?: boolean;
}

export function IdentityFields({
  businessName, logoUrl, coverUrl, primary, extracted,
  onPickFile, onRemoveLogo, onPickExtracted, onPickCoverPreset,
  showName = true,
}: IdentityProps) {
  return (
    <div>
      {showName && (
        <>
          <div style={glabel}>Nome (herdado do cadastro)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#f1f1f4', borderRadius: 11, padding: '11px 13px' }}>
            <b style={{ fontSize: 14 }}>{businessName}</b>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, color: '#047857', background: '#e9f7f1', padding: '3px 8px', borderRadius: 99 }}>herdado</span>
          </div>
        </>
      )}

      <div style={glabel}>Logo · extrai as cores ao subir</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <label style={{ width: 52, height: 52, borderRadius: 13, border: '1.5px dashed #e7e7ec', display: 'grid', placeItems: 'center', overflow: 'hidden', cursor: 'pointer', color: '#a1a1aa', flex: 'none', background: '#fafafa' }}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : <ImageIcon size={18} />}
          <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onPickFile(f, 'logo'); e.target.value = ''; }} />
        </label>
        <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.4 }}>
          Ao subir, abrimos o <b style={{ color: '#0c0c12' }}>recortador</b> e extraímos a paleta.
        </div>
        {logoUrl && (
          <button onClick={onRemoveLogo} style={miniBtn} aria-label="Remover logo"><Trash2 size={14} /></button>
        )}
      </div>
      {extracted.length > 0 && (
        <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
          {extracted.map(c => (
            <button key={c} onClick={() => onPickExtracted(c)} title={c}
              style={{ width: 30, height: 30, borderRadius: 8, background: c, cursor: 'pointer', boxShadow: '0 0 0 1px #e7e7ec', border: primary === c ? '2px solid #0c0c12' : '2px solid #fff' }} />
          ))}
        </div>
      )}

      <div style={glabel}>Capa do painel</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {COVER_PRESETS.map(id => {
          const sel = coverUrl === `preset:${id}` || (!coverUrl && id === 'gradient');
          const label = id === 'monogram' ? 'Monograma' : id === 'glow' ? 'Brilho' : 'Gradiente';
          return (
            <button key={id} onClick={() => onPickCoverPreset(`preset:${id}`)}
              style={{ height: 50, borderRadius: 10, background: coverBackground(`preset:${id}`, primary).background, border: sel ? '2px solid #0c0c12' : '2px solid transparent', boxShadow: '0 0 0 1px #e7e7ec', cursor: 'pointer', color: '#fff', fontSize: 11.5, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,.5)' }}>
              {label}
            </button>
          );
        })}
        <label style={{ height: 50, borderRadius: 10, cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 600, color: coverUrl?.startsWith('data:') ? '#fff' : '#71717a', border: coverUrl?.startsWith('data:') ? '2px solid #0c0c12' : '1.5px dashed #e7e7ec', background: coverUrl?.startsWith('data:') ? `linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.4)), url("${coverUrl}") center/cover` : 'transparent', textShadow: coverUrl?.startsWith('data:') ? '0 1px 4px rgba(0,0,0,.6)' : 'none' }}>
          {coverUrl?.startsWith('data:') ? 'Trocar foto' : 'Subir foto'}
          <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onPickFile(f, 'cover'); e.target.value = ''; }} />
        </label>
      </div>
    </div>
  );
}

/* ---------- SOBRE NOS ---------- */

export function AboutField({ value, onChange, showLabel = true }: { value: string; onChange: (v: string) => void; showLabel?: boolean }) {
  return (
    <div>
      {showLabel && <div style={glabel}>Sobre nós</div>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder="Conte a história do lugar, o que torna o atendimento especial..."
        style={{ width: '100%', minHeight: 84, resize: 'vertical', border: '1px solid #e7e7ec', borderRadius: 11, padding: 11, fontFamily: 'inherit', fontSize: 13, color: '#0c0c12' }} maxLength={1500} />
      <div style={{ fontSize: 11, color: '#a1a1aa', textAlign: 'right', marginTop: 4 }}>{value.length}/1500</div>
    </div>
  );
}

/* ---------- ENDERECO + MAPA ---------- */

interface AddressProps {
  address: string;
  lat: number | null;
  lng: number | null;
  onChangeAddress: (v: string) => void;
  onChangeCoords: (lat: number, lng: number) => void;
  showLabel?: boolean;
}

export function AddressField({ address, lat, lng, onChangeAddress, onChangeCoords, showLabel = true }: AddressProps) {
  return (
    <div>
      {showLabel && <div style={glabel}>Endereço</div>}
      <input value={address} onChange={e => onChangeAddress(e.target.value)} placeholder="Rua, número — bairro, cidade - UF" style={inp} />
      <div style={{ marginTop: 8 }}>
        <MapPicker lat={lat} lng={lng} address={address} onChange={onChangeCoords} />
      </div>
    </div>
  );
}

/* ---------- REDES SOCIAIS ---------- */

export function SocialsField({ socials, onChange, showLabel = true }: { socials: BusinessSocials; onChange: (key: keyof BusinessSocials, value: string) => void; showLabel?: boolean }) {
  return (
    <div>
      {showLabel && <div style={glabel}>Redes sociais</div>}
      <SocialInput icon={<Instagram size={15} />} value={socials.instagram ?? ''} onChange={v => onChange('instagram', v)} placeholder="@seuperfil" />
      <SocialInput icon={<Phone size={15} />} value={socials.whatsapp ?? ''} onChange={v => onChange('whatsapp', v)} placeholder="WhatsApp — (11) 9...." />
      <SocialInput icon={<Globe size={15} />} value={socials.website ?? ''} onChange={v => onChange('website', v)} placeholder="https://seusite.com.br" />
    </div>
  );
}

/* ---------- EQUIPE (aviso) + FOTOS ---------- */

interface TeamPhotosProps {
  gallery: string[];
  onPickFile: (file: File, target: CropTarget) => void;
  onRemovePhoto: (index: number) => void;
  showTeamNote?: boolean;
}

export function TeamAndPhotosFields({ gallery, onPickFile, onRemovePhoto, showTeamNote = true }: TeamPhotosProps) {
  return (
    <div>
      {showTeamNote && (
        <>
          <div style={glabel}>Equipe</div>
          <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: '#f7f7f9', border: '1px solid #eee', borderRadius: 12, padding: '12px 14px', fontSize: 12.5, color: '#52525b', lineHeight: 1.45 }}>
            <Users size={16} style={{ flex: 'none', marginTop: 1, color: '#71717a' }} />
            <span>A equipe aparece automaticamente no link, com os avatares dos <b>profissionais com agendamento online</b>. Edite quem aparece em <b>Equipe</b>.</span>
          </div>
        </>
      )}

      <div style={glabel}>Fotos do estabelecimento <span style={{ color: '#a1a1aa', fontWeight: 600 }}>· até 3</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {gallery.map((g, i) => (
          <div key={`${i}-${g.slice(-24)}`} style={{ position: 'relative', aspectRatio: '1', borderRadius: 11, overflow: 'hidden', boxShadow: '0 0 0 1px #e7e7ec' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button onClick={() => onRemovePhoto(i)} aria-label="Remover foto"
              style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(12,12,18,.7)', color: '#fff', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {gallery.length < 3 && (
          <label style={{ aspectRatio: '1', borderRadius: 11, border: '1.5px dashed #e7e7ec', display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#a1a1aa' }}>
            <UploadCloud size={18} />
            <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onPickFile(f, 'gallery'); e.target.value = ''; }} />
          </label>
        )}
      </div>
      <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 8 }}>Cada foto passa pelo recortador (quadrada).</div>
    </div>
  );
}

/* ---------- CORES ---------- */

interface ColorsProps {
  theme: BusinessTheme;
  onSet: <K extends keyof BusinessTheme>(key: K, value: BusinessTheme[K]) => void;
  onApplyPreset: (preset: ThemePreset) => void;
  showPresets?: boolean;
}

export function ColorsFields({ theme, onSet, onApplyPreset, showPresets = true }: ColorsProps) {
  const onPrimaryResolved = theme.onPrimary === 'auto' ? bestTextOn(theme.primary) : theme.onPrimary;

  return (
    <div>
      {showPresets && (
        <>
          <div style={glabel}>Modelos prontos</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9 }}>
            {THEME_PRESETS.map(p => {
              const on = theme.primary === p.primary && theme.bg === p.bg;
              return (
                <button key={p.id} onClick={() => onApplyPreset(p)}
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
        </>
      )}

      <div style={glabel}>Ajuste fino</div>
      <Field label="Cor principal" sub="Botão · destaques · selects">
        <ColorInput value={theme.primary} onChange={v => onSet('primary', v)} />
      </Field>
      <Field label="Texto do botão" sub="Auto por contraste">
        <ColorInput value={onPrimaryResolved} code={theme.onPrimary === 'auto' ? `auto · ${onPrimaryResolved}` : onPrimaryResolved} onChange={v => onSet('onPrimary', v)} />
      </Field>
      <Field label="Cor dos cards" sub="Superfície dos blocos">
        <ColorInput value={theme.surface} onChange={v => onSet('surface', v)} />
      </Field>

      <div style={glabel}>Fundo / papel de parede</div>
      <Field label="Cor de fundo">
        <ColorInput value={theme.bg} onChange={v => onSet('bg', v)} />
      </Field>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        {WALLS.map(w => (
          <button key={w.id} onClick={() => onSet('wall', w.id)}
            style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: theme.wall === w.id ? '1.5px solid #dc2626' : '1.5px solid #e7e7ec', boxShadow: theme.wall === w.id ? '0 0 0 3px #fff5f5' : 'none', color: '#3a3a44', background: '#fff' }}>
            {w.label}
          </button>
        ))}
      </div>
    </div>
  );
}
