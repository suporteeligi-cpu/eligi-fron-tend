'use client';

// src/features/settings/components/ProfileThemeEditor.tsx
//
// Editor de personalização do Perfil Público (cores).
// - GET  /business-settings        → pré-preenche o tema salvo
// - PATCH /business-settings/theme  → salva
// Extração de cor é client-only (canvas). Guard-rail de contraste no botão.
//
// AJUSTE o prefixo SETTINGS_BASE abaixo se o seu router de business-settings
// estiver montado em outro caminho.

import { useEffect, useMemo, useState } from 'react';
import { UploadCloud, Check, AlertTriangle, Loader2, Palette, Save } from 'lucide-react';
import api from '@/shared/lib/apiClient';
import {
  type BusinessTheme,
  type WallPattern,
  THEME_PRESETS,
  sanitizeTheme,
  deriveTheme,
  bestTextOn,
  checkReadability,
} from '@/shared/profileTheme';

const SETTINGS_BASE = '/business-settings';

// keyframe próprio (o dashboard não usa Tailwind, então não há `spin` global)
if (typeof document !== 'undefined' && !document.getElementById('eligi-spin-kf')) {
  const s = document.createElement('style');
  s.id = 'eligi-spin-kf';
  s.textContent = '@keyframes eligi-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(s);
}

/* ---------- extração de cores da imagem (client-only) ---------- */
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
    if (distinct) {
      out.push(o);
      if (out.length >= count) break;
    }
  }
  return out.map(o => `#${hex(o.r)}${hex(o.g)}${hex(o.b)}`);
}

const WALLS: Array<{ id: WallPattern; label: string }> = [
  { id: 'none', label: 'Liso' },
  { id: 'dots', label: 'Pontos' },
  { id: 'grid', label: 'Grade' },
];

interface Props {
  /** Tema já carregado pelo parent (evita um GET extra). Se ausente, o editor busca sozinho. */
  initialTheme?: Partial<BusinessTheme> | null;
  onSaved?: (theme: BusinessTheme) => void;
}

export function ProfileThemeEditor({ initialTheme, onSaved }: Props) {
  const hasInitial = initialTheme != null;
  const [theme, setTheme] = useState<BusinessTheme>(() => sanitizeTheme(initialTheme ?? undefined));
  const [extracted, setExtracted] = useState<string[]>([]);
  const [loading, setLoading] = useState(!hasInitial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // pré-preenche com o tema salvo — só quando o parent NÃO passou initialTheme
  useEffect(() => {
    if (hasInitial) return;
    let active = true;
    api
      .get(`${SETTINGS_BASE}`)
      .then(res => {
        const payload = res.data?.data ?? res.data;
        if (active) setTheme(sanitizeTheme(payload?.theme));
      })
      .catch(() => {
        /* sem tema salvo → mantém o default */
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [hasInitial]);

  const vars = useMemo(() => deriveTheme(theme), [theme]);
  const readability = useMemo(() => checkReadability(theme), [theme]);

  function set<K extends keyof BusinessTheme>(key: K, value: BusinessTheme[K]) {
    setSaved(false);
    setTheme(t => ({ ...t, [key]: value }));
  }

  function applyPreset(p: (typeof THEME_PRESETS)[number]) {
    setSaved(false);
    setTheme(t => ({ ...t, primary: p.primary, bg: p.bg, surface: p.surface, onPrimary: 'auto' }));
  }

  function handleFile(file: File) {
    const img = new Image();
    img.onload = () => {
      const cols = extractPalette(img, 6);
      setExtracted(cols);
      if (cols[0]) {
        setSaved(false);
        setTheme(t => ({ ...t, primary: cols[0], onPrimary: 'auto' }));
      }
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  }

  async function save() {
    setSaving(true);
    try {
      await api.patch(`${SETTINGS_BASE}/theme`, theme);
      setSaved(true);
      onSaved?.(theme);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: 240, color: '#71717a' }}>
        <Loader2 size={22} style={{ animation: 'eligi-spin 1s linear infinite' }} />
      </div>
    );
  }

  const onPrimaryResolved = theme.onPrimary === 'auto' ? bestTextOn(theme.primary) : theme.onPrimary;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: 22, alignItems: 'start' }}>
      {/* ---------- CONTROLES ---------- */}
      <div style={card}>
        {/* 1. Extrair da marca */}
        <Section title="1 · Extrair da marca">
          <label style={drop}>
            <UploadCloud size={22} style={{ margin: '0 auto' }} />
            <b style={{ display: 'block', margin: '8px 0 2px', color: '#0c0c12', fontSize: 14 }}>Subir logo ou capa</b>
            <span style={{ fontSize: 12 }}>Lemos as cores e sugerimos a paleta</span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>
          {extracted.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {extracted.map(c => (
                <button
                  key={c}
                  onClick={() => set('primary', c)}
                  title={c}
                  style={{
                    width: 42, height: 42, borderRadius: 11, background: c, cursor: 'pointer',
                    border: theme.primary === c ? '2px solid #0c0c12' : '2px solid #fff',
                    boxShadow: '0 0 0 1px #e7e7ec',
                  }}
                />
              ))}
            </div>
          )}
        </Section>

        {/* 2. Presets */}
        <Section title="2 · Modelos prontos">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9 }}>
            {THEME_PRESETS.map(p => {
              const on = theme.primary === p.primary && theme.bg === p.bg;
              return (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  style={{
                    border: on ? '1.5px solid #dc2626' : '1.5px solid #e7e7ec',
                    boxShadow: on ? '0 0 0 3px #fff5f5' : 'none',
                    borderRadius: 13, padding: 9, textAlign: 'left', cursor: 'pointer', background: '#fff',
                  }}
                >
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
        </Section>

        {/* 3. Ajuste fino */}
        <Section title="3 · Ajuste fino">
          <Field label="Cor principal" sub="Botão · destaques · selects">
            <ColorInput value={theme.primary} onChange={v => set('primary', v)} />
          </Field>
          <Field label="Texto do botão" sub="Auto por contraste">
            <ColorInput
              value={onPrimaryResolved}
              code={theme.onPrimary === 'auto' ? `auto · ${onPrimaryResolved}` : onPrimaryResolved}
              onChange={v => set('onPrimary', v)}
            />
          </Field>
          <Field label="Cor dos cards" sub="Superfície dos blocos">
            <ColorInput value={theme.surface} onChange={v => set('surface', v)} />
          </Field>
        </Section>

        {/* 4. Fundo / papel de parede */}
        <Section title="4 · Fundo / papel de parede">
          <Field label="Cor de fundo">
            <ColorInput value={theme.bg} onChange={v => set('bg', v)} />
          </Field>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {WALLS.map(w => (
              <button
                key={w.id}
                onClick={() => set('wall', w.id)}
                style={{
                  padding: '8px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  border: theme.wall === w.id ? '1.5px solid #dc2626' : '1.5px solid #e7e7ec',
                  boxShadow: theme.wall === w.id ? '0 0 0 3px #fff5f5' : 'none',
                  color: '#3a3a44', background: '#fff',
                }}
              >
                {w.label}
              </button>
            ))}
          </div>
        </Section>

        {/* guard-rail + salvar */}
        <div style={{ paddingTop: 16 }}>
          {readability.ok ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#047857', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              <Check size={15} /> Paleta legível e dentro do padrão.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 11, padding: '10px 12px', fontSize: 12, fontWeight: 600, marginBottom: 12, lineHeight: 1.4 }}>
              <AlertTriangle size={15} style={{ flex: 'none', marginTop: 1 }} />
              <span>
                Contraste baixo no botão ({readability.ratio.toFixed(1)}:1). Sugerimos texto{' '}
                {readability.suggestedOnPrimary === '#ffffff' ? 'branco' : 'escuro'}.
              </span>
            </div>
          )}
          <button
            onClick={save}
            disabled={saving}
            style={{
              width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', fontWeight: 700, fontSize: 14,
              borderRadius: 12, padding: '13px 18px', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <Loader2 size={16} style={{ animation: 'eligi-spin 1s linear infinite' }} /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'Salvando…' : saved ? 'Salvo' : 'Salvar personalização'}
          </button>
        </div>
      </div>

      {/* ---------- PREVIEW ---------- */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#71717a', fontSize: 13, fontWeight: 600 }}>
          <Palette size={15} /> Preview ao vivo
        </div>
        <div style={{ ...(vars as React.CSSProperties), borderRadius: 20, overflow: 'hidden', border: '1px solid #dfdfe4', boxShadow: '0 1px 2px rgba(12,12,18,.04),0 24px 60px -30px rgba(12,12,18,.3)' }}>
          <Preview />
        </div>
      </div>
    </div>
  );
}

/* ---------- preview que consome as CSS vars (--p-*) ---------- */
function Preview() {
  return (
    <div style={{ background: 'var(--p-bg)', backgroundImage: 'var(--p-bg-img)', backgroundSize: '18px 18px', padding: 22 }}>
      <div style={{ background: 'var(--p-surface)', border: '1px solid var(--p-line)', borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, padding: '6px 11px', borderRadius: 99, background: 'var(--p-pill)', color: 'var(--p-primary)' }}>★ 4,9 (212)</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-muted)' }}>Barbearia Navalha de Ouro</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--p-accent)', boxShadow: '0 0 0 3px color-mix(in srgb, var(--p-accent) 14%, transparent)', borderRadius: 11, padding: '11px 13px', fontSize: 13.5, fontWeight: 600, color: 'var(--p-text)', background: 'var(--p-surface)' }}>
            Corte + Barba · 1h10 <span style={{ marginLeft: 'auto', color: 'var(--p-accent)' }}>▾</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--p-line)', borderRadius: 11, padding: '11px 13px', fontSize: 13.5, fontWeight: 600, color: 'var(--p-text)', background: 'var(--p-surface)' }}>
            Corte Masculino · 40 min
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 4px', borderTop: '1px solid var(--p-line-2)', marginTop: 14 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--p-text)' }}>Corte + Barba</div>
            <div style={{ fontSize: 13, color: 'var(--p-muted)' }}>1h10</div>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--p-text)' }}>R$ 95</span>
        </div>

        <button
          style={{
            width: '100%', marginTop: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            background: 'linear-gradient(135deg, var(--p-primary), var(--p-primary-2))', color: 'var(--p-on-primary)',
            fontWeight: 700, fontSize: 15, borderRadius: 13, padding: '15px 26px', border: 'none', cursor: 'pointer',
            boxShadow: '0 12px 26px -12px var(--p-primary)',
          }}
        >
          Agendar horário
        </button>
      </div>

      {/* amostra do painel escuro do Modelo B (token --p-panel) */}
      <div style={{ marginTop: 14, background: 'var(--p-panel)', borderRadius: 14, padding: 16, color: '#fff' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.55, fontWeight: 700 }}>Painel (Modelo B)</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>Navalha de Ouro</div>
      </div>
    </div>
  );
}

/* ---------- subcomponentes de UI ---------- */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid #f1f1f4' }}>
      <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#71717a', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

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
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#dc2626'}
          onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', inset: -6, width: '150%', height: '150%', border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
        />
      </label>
      <code style={{ fontSize: 11.5, color: '#71717a', fontWeight: 600, minWidth: 70 }}>{code ?? value}</code>
    </div>
  );
}

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e7e7ec',
  borderRadius: 20,
  boxShadow: '0 1px 2px rgba(12,12,18,.04),0 14px 36px -16px rgba(12,12,18,.18)',
  padding: 20,
};

const drop: React.CSSProperties = {
  display: 'block',
  border: '1.5px dashed #e7e7ec',
  borderRadius: 14,
  padding: 22,
  textAlign: 'center',
  color: '#71717a',
  cursor: 'pointer',
};

export default ProfileThemeEditor;
