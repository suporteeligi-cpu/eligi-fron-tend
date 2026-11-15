'use client';
// src/features/settings/components/ProfileFields.tsx
//
// @eligi:profile-fields-modulo
// @eligi:profile-fields-v2 — sobrou so o editor de cores. Identidade, sobre,
// endereco, redes e fotos ganharam editores proprios em
// app/dashboard/configuracoes/empresa/components (ver @eligi:doc-cfg-perfil).
// Alvos de 44 px e selecionado em grafite (era vermelho).

import {
  type BusinessTheme,
  type WallPattern,
  type ThemePreset,
  THEME_PRESETS,
  bestTextOn,
} from '@/shared/profileTheme';

const WALLS: Array<{ id: WallPattern; label: string }> = [
  { id: 'none', label: 'Liso' },
  { id: 'dots', label: 'Pontos' },
  { id: 'grid', label: 'Grade' },
];

const INK = '#111114';

export const glabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, color: '#6b6b73', textTransform: 'uppercase', letterSpacing: '.06em',
  margin: '18px 0 8px', fontFamily: 'var(--font-eligi-mono), ui-monospace, monospace',
};

export function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 0', minHeight: 52 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: INK }}>{label}</div>
        {sub && <div style={{ fontSize: 12.5, color: '#6b6b73' }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

export function ColorInput({ value, code, label, onChange }: { value: string; code?: string; label: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <code style={{ fontSize: 12, color: '#6b6b73', fontFamily: 'var(--font-eligi-mono), ui-monospace, monospace' }}>{code ?? value}</code>
      <label style={{ width: 44, height: 44, borderRadius: 12, border: '2px solid #fff', boxShadow: '0 0 0 1px #e3e3e8', overflow: 'hidden', cursor: 'pointer', position: 'relative', background: value }}>
        <input type="color" aria-label={label} value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#dc2626'} onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', inset: -6, width: '150%', height: '150%', border: 'none', padding: 0, cursor: 'pointer', background: 'none', opacity: 0 }} />
      </label>
    </div>
  );
}

interface ColorsProps {
  theme: BusinessTheme;
  onSet: <K extends keyof BusinessTheme>(key: K, value: BusinessTheme[K]) => void;
  onApplyPreset: (preset: ThemePreset) => void;
}

export function ColorsFields({ theme, onSet, onApplyPreset }: ColorsProps) {
  const onPrimaryResolved = theme.onPrimary === 'auto' ? bestTextOn(theme.primary) : theme.onPrimary;
  return (
    <div>
      <div style={glabel}>Modelos prontos</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
        {THEME_PRESETS.map(p => {
          const on = theme.primary === p.primary && theme.bg === p.bg;
          return (
            <button key={p.id} type="button" aria-pressed={on} onClick={() => onApplyPreset(p)}
              style={{ border: on ? `2px solid ${INK}` : '1px solid #e3e3e8', borderRadius: 14, padding: 10, minHeight: 64, textAlign: 'left', cursor: 'pointer', background: '#fff', fontFamily: 'inherit' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 7 }}>
                {[p.primary, p.surface, p.bg].map((c, i) => (
                  <i key={i} style={{ width: 16, height: 16, borderRadius: 5, background: c, boxShadow: 'inset 0 0 0 1px #e3e3e8', display: 'block' }} />
                ))}
              </div>
              <small style={{ fontSize: 12.5, fontWeight: 600, color: '#3a3a44' }}>{p.label}</small>
            </button>
          );
        })}
      </div>

      <div style={glabel}>Ajuste fino</div>
      <Field label="Cor principal" sub="Botões e destaques">
        <ColorInput label="Cor principal" value={theme.primary} onChange={v => onSet('primary', v)} />
      </Field>
      <Field label="Texto do botão" sub="Automático pelo contraste">
        <ColorInput label="Texto do botão" value={onPrimaryResolved} code={theme.onPrimary === 'auto' ? 'auto' : onPrimaryResolved} onChange={v => onSet('onPrimary', v)} />
      </Field>
      <Field label="Cor dos cartões" sub="Fundo dos blocos">
        <ColorInput label="Cor dos cartões" value={theme.surface} onChange={v => onSet('surface', v)} />
      </Field>
      <Field label="Cor de fundo">
        <ColorInput label="Cor de fundo" value={theme.bg} onChange={v => onSet('bg', v)} />
      </Field>

      <div style={glabel}>Textura do fundo</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {WALLS.map(w => (
          <button key={w.id} type="button" aria-pressed={theme.wall === w.id} onClick={() => onSet('wall', w.id)}
            style={{ minHeight: 44, padding: '0 16px', borderRadius: 999, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: theme.wall === w.id ? `1px solid ${INK}` : '1px solid #e3e3e8', color: theme.wall === w.id ? '#fff' : INK, background: theme.wall === w.id ? INK : '#fff' }}>
            {w.label}
          </button>
        ))}
      </div>
    </div>
  );
}
