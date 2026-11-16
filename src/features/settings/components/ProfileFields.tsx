'use client';
// src/features/settings/components/ProfileFields.tsx
//
// @eligi:profile-fields-modulo
// @eligi:profile-fields-v2 — sobrou so o editor de cores. Identidade, sobre,
// endereco, redes e fotos ganharam editores proprios em
// app/dashboard/configuracoes/empresa/components (ver @eligi:doc-cfg-perfil).
// Alvos de 44 px e selecionado em grafite (era vermelho).
// @eligi:profile-style-editor (nov/2026, direcao B): "Cor dos cartoes" e
// "Textura do fundo" sairam (o link nunca usou os dois). No lugar, o estilo do
// perfil, que muda fundo, brilho, textura e cartoes juntos.

import {
  type BusinessTheme,
  type ProfileStyle,
  type ThemePreset,
  THEME_PRESETS,
  bestTextOn,
  pageStyleVars,
} from '@/shared/profileTheme';

export const STYLE_INFO: Array<{ id: ProfileStyle; label: string; desc: string }> = [
  { id: 'claro', label: 'Claro', desc: 'Fundo claro na cor que você escolher. É como o link é hoje.' },
  { id: 'marca', label: 'Tom da marca', desc: 'O fundo pega um pouco da sua cor e ganha um brilho no topo.' },
  { id: 'papel', label: 'Papel', desc: 'Bege quente com granulado leve. Clássico e aconchegante.' },
];

export function styleLabel(style: ProfileStyle | undefined): string {
  return STYLE_INFO.find(s => s.id === (style ?? 'claro'))?.label ?? 'Claro';
}

/** Amostra do estilo: o mesmo fundo do link, em miniatura. */
function StyleSwatch({ primary, bg, style }: { primary: string; bg: string; style: ProfileStyle }) {
  const v = pageStyleVars(primary, bg, style);
  return (
    <span aria-hidden style={{
      display: 'block', height: 64, borderRadius: 10, position: 'relative', overflow: 'hidden',
      boxShadow: 'inset 0 0 0 1px rgba(17,17,20,.08)',
      backgroundColor: v['--background'],
      backgroundImage: `${v['--page-tex']}, ${v['--page-glow'].replace('900px 560px at 50% -120px', '160px 90px at 50% -20px')}`,
      backgroundSize: `${v['--page-tex-size']}, auto`,
    }}>
      <span style={{ position: 'absolute', left: 10, right: 10, bottom: 10, height: 20, borderRadius: 7, background: v['--glass-bg'], boxShadow: `inset 0 0 0 1px ${v['--glass-line']}` }} />
      <span style={{ position: 'absolute', left: 10, top: 10, width: 28, height: 8, borderRadius: 4, background: primary }} />
    </span>
  );
}

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
  const style: ProfileStyle = theme.style ?? 'claro';
  return (
    <div>
      <div style={glabel}>Estilo do perfil</div>
      <div role="radiogroup" aria-label="Estilo do perfil" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
        {STYLE_INFO.map(o => {
          const on = style === o.id;
          return (
            <button key={o.id} type="button" role="radio" aria-checked={on} onClick={() => onSet('style', o.id)}
              style={{ border: on ? `2px solid ${INK}` : '1px solid #e3e3e8', borderRadius: 14, padding: on ? 9 : 10, textAlign: 'left', cursor: 'pointer', background: '#fff', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <StyleSwatch primary={theme.primary} bg={theme.bg} style={o.id} />
              <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>{o.label}</span>
              <span style={{ fontSize: 12.5, lineHeight: 1.4, color: '#6b6b73' }}>{o.desc}</span>
            </button>
          );
        })}
      </div>

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
      {style === 'claro' ? (
        <Field label="Cor de fundo" sub="Só no estilo Claro">
          <ColorInput label="Cor de fundo" value={theme.bg} onChange={v => onSet('bg', v)} />
        </Field>
      ) : (
        <div style={{ fontSize: 12.5, lineHeight: 1.45, color: '#6b6b73', padding: '8px 0' }}>
          No estilo {styleLabel(style)} o fundo vem pronto. Para escolher a cor do fundo, use o Claro.
        </div>
      )}
    </div>
  );
}
