'use client';

// src/features/settings/components/BusinessPreview.tsx
//
// @eligi:business-preview-componente
// @eligi:preview-slots-editaveis
// Espelho do link publico (app.eligi.com.br/<slug>) dentro do dashboard.
//
// DOIS MODOS
// - LEITURA (sem `onEditSlot`): identico ao preview de sempre.
// - EDICAO (com `onEditSlot`): cada regiao ganha um pino, e regiao VAZIA vira
//   um alvo pontilhado "Adicionar ...". Sem isso, quem ainda nao escreveu o
//   "sobre nos" nao teria onde tocar — o preview mostraria o buraco e nao
//   ofereceria saida.
//
// CONTRATO: componente PURO. Recebe tudo por prop, nao faz fetch, nao guarda
// estado. As CSS variables saem de `deriveTheme` (fonte unica em
// shared/profileTheme.ts) — nenhum calculo de cor ou contraste vive aqui.

import { Instagram, Phone, Globe, MapPin, Pencil, Plus } from 'lucide-react';
import {
  type BusinessTheme,
  type BusinessSocials,
  deriveTheme,
  coverBackground,
  isMonogramCover,
} from '@/shared/profileTheme';

/** Regioes editaveis do preview. */
export type PreviewSlot = 'logo' | 'appearance' | 'about' | 'address' | 'socials' | 'photos';

/** Iniciais do negocio, usadas sem logo e na marca-d'agua do monograma. */
export function initialsOf(name: string): string {
  const t = (name || '').trim();
  if (!t) return 'E';
  return t.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/**
 * Pino de edicao. Alvo REAL de 44px com o disco visivel de 28px dentro: um
 * alvo do tamanho do icone, sobre area rolavel, produz toque fantasma.
 */
function EditPin({
  onClick, label, position,
}: {
  onClick: () => void;
  label: string;
  position: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        position: 'absolute',
        width: 44,
        height: 44,
        display: 'grid',
        placeItems: 'center',
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        zIndex: 4,
        ...position,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#fff',
          color: 'var(--p-primary)',
          border: '1.5px solid var(--p-primary)',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 2px 10px rgba(12,12,18,.28)',
        }}
      >
        <Pencil size={13} />
      </span>
    </button>
  );
}

/** Alvo para regiao ainda vazia: mostra o que falta E oferece o caminho. */
function EmptySlot({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        width: '100%',
        minHeight: 44,
        marginTop: 12,
        padding: '10px 12px',
        borderRadius: 11,
        border: '1.5px dashed var(--p-line)',
        background: 'transparent',
        color: 'var(--p-muted)',
        fontSize: 12.5,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Plus size={14} />
      {label}
    </button>
  );
}

interface Props {
  businessName: string;
  theme: BusinessTheme;
  logoUrl: string | null;
  coverUrl: string | null;
  about?: string | null;
  address?: string | null;
  socials?: BusinessSocials | null;
  gallery?: string[] | null;
  /** Presente = modo edicao (pinos e alvos vazios). Ausente = so' leitura. */
  onEditSlot?: (slot: PreviewSlot) => void;
}

export function BusinessPreview({
  businessName,
  theme,
  logoUrl,
  coverUrl,
  about,
  address,
  socials,
  gallery,
  onEditSlot,
}: Props) {
  const vars = deriveTheme(theme);
  const cover = coverBackground(coverUrl, theme.primary);
  const watermark = isMonogramCover(coverUrl);
  const ini = initialsOf(businessName);

  const editable = typeof onEditSlot === 'function';
  const edit = (slot: PreviewSlot) => () => onEditSlot?.(slot);

  const aboutText = (about ?? '').trim();
  const addressText = (address ?? '').trim();
  const photos = (gallery ?? []).filter(Boolean).slice(0, 3);

  const socialItems: Array<{ key: string; icon: React.ReactNode; label: string }> = [];
  if (socials?.instagram) {
    socialItems.push({
      key: 'ig',
      icon: <Instagram size={14} />,
      label: `@${socials.instagram.replace(/^@+/, '')}`,
    });
  }
  if (socials?.whatsapp) {
    socialItems.push({ key: 'wa', icon: <Phone size={14} />, label: socials.whatsapp });
  }
  if (socials?.website) {
    socialItems.push({
      key: 'site',
      icon: <Globe size={14} />,
      label: socials.website.replace(/^https?:\/\//, '').replace(/\/+$/, ''),
    });
  }

  return (
    <div
      style={{
        ...(vars as React.CSSProperties),
        borderRadius: 20,
        overflow: 'hidden',
        border: '1px solid #dfdfe4',
        boxShadow: '0 1px 2px rgba(12,12,18,.04),0 24px 60px -30px rgba(12,12,18,.3)',
      }}
    >
      <div
        style={{
          background: 'var(--p-bg)',
          backgroundImage: 'var(--p-bg-img)',
          backgroundSize: '18px 18px',
          padding: 22,
        }}
      >
        {/* capa */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 16,
            padding: 20,
            marginBottom: 14,
            color: '#fff',
            background: cover.background,
          }}
        >
          {watermark && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                right: -16,
                bottom: -40,
                fontSize: 150,
                lineHeight: 0.7,
                fontWeight: 800,
                color: theme.primary,
                opacity: 0.16,
                userSelect: 'none',
              }}
            >
              {ini.slice(0, 1)}
            </div>
          )}

          <div style={{ position: 'relative', zIndex: 1, display: 'inline-block' }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 13,
                overflow: 'hidden',
                background: '#fff',
                color: theme.primary,
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                fontSize: 20,
              }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                ini
              )}
            </div>
            {editable && (
              <EditPin onClick={edit('logo')} label="Editar logo" position={{ top: 24, left: 24 }} />
            )}
          </div>

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              marginTop: 14,
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: '-0.01em',
            }}
          >
            {businessName}
          </div>
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              marginTop: 3,
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Agende seu horário
          </div>

          {editable && (
            <EditPin
              onClick={edit('appearance')}
              label="Editar cores e capa"
              position={{ top: 6, right: 6 }}
            />
          )}
        </div>

        {/* card */}
        <div
          style={{
            background: 'var(--p-surface)',
            border: '1px solid var(--p-line)',
            borderRadius: 16,
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 700,
                padding: '6px 11px',
                borderRadius: 99,
                background: 'var(--p-pill)',
                color: 'var(--p-primary)',
              }}
            >
              ★ 4,9 (212)
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-muted)' }}>
              {businessName}
            </span>
          </div>

          {/* sobre */}
          {aboutText ? (
            <div style={{ position: 'relative' }}>
              <p
                style={{
                  margin: '14px 0 0',
                  paddingRight: editable ? 34 : 0,
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  color: 'var(--p-text)',
                  opacity: 0.78,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  whiteSpace: 'pre-line',
                }}
              >
                {aboutText}
              </p>
              {editable && (
                <EditPin onClick={edit('about')} label="Editar sobre nós" position={{ top: 4, right: -10 }} />
              )}
            </div>
          ) : (
            editable && <EmptySlot onClick={edit('about')} label="Adicionar descrição" />
          )}

          {/* endereco */}
          {addressText ? (
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 7,
                  marginTop: 12,
                  paddingRight: editable ? 34 : 0,
                  fontSize: 12.5,
                  lineHeight: 1.4,
                  color: 'var(--p-muted)',
                }}
              >
                <MapPin size={14} style={{ flex: 'none', marginTop: 1, color: 'var(--p-accent)' }} />
                <span>{addressText}</span>
              </div>
              {editable && (
                <EditPin onClick={edit('address')} label="Editar endereço" position={{ top: 0, right: -10 }} />
              )}
            </div>
          ) : (
            editable && <EmptySlot onClick={edit('address')} label="Adicionar endereço" />
          )}

          {/* fotos */}
          {photos.length > 0 ? (
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${photos.length}, 1fr)`,
                  gap: 7,
                  marginTop: 14,
                }}
              >
                {photos.map((src, i) => (
                  <div
                    key={`${i}-${src.slice(-24)}`}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 10,
                      overflow: 'hidden',
                      boxShadow: 'inset 0 0 0 1px var(--p-line)',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
              {editable && (
                <EditPin onClick={edit('photos')} label="Editar fotos" position={{ top: 4, right: -10 }} />
              )}
            </div>
          ) : (
            editable && <EmptySlot onClick={edit('photos')} label="Adicionar fotos do espaço" />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1.5px solid var(--p-accent)',
                boxShadow: '0 0 0 3px color-mix(in srgb, var(--p-accent) 14%, transparent)',
                borderRadius: 11,
                padding: '11px 13px',
                fontSize: 13.5,
                fontWeight: 600,
                color: 'var(--p-text)',
                background: 'var(--p-surface)',
              }}
            >
              Corte + Barba · 1h10{' '}
              <span style={{ marginLeft: 'auto', color: 'var(--p-accent)' }}>▾</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1.5px solid var(--p-line)',
                borderRadius: 11,
                padding: '11px 13px',
                fontSize: 13.5,
                fontWeight: 600,
                color: 'var(--p-text)',
                background: 'var(--p-surface)',
              }}
            >
              Corte Masculino · 40 min
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--p-muted)', marginTop: 8 }}>
            Serviços de exemplo. O cliente vê os seus.
          </div>

          <button
            type="button"
            style={{
              width: '100%',
              marginTop: 16,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 9,
              background: 'linear-gradient(135deg, var(--p-primary), var(--p-primary-2))',
              color: 'var(--p-on-primary)',
              fontWeight: 700,
              fontSize: 15,
              borderRadius: 13,
              padding: '15px 26px',
              border: 'none',
              cursor: 'default',
              boxShadow: '0 12px 26px -12px var(--p-primary)',
            }}
          >
            Agendar horário
          </button>

          {/* redes */}
          {socialItems.length > 0 ? (
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 7,
                  marginTop: 16,
                  paddingTop: 14,
                  paddingRight: editable ? 34 : 0,
                  borderTop: '1px solid var(--p-line-2)',
                }}
              >
                {socialItems.map(s => (
                  <span
                    key={s.key}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      maxWidth: '100%',
                      padding: '6px 10px',
                      borderRadius: 99,
                      background: 'var(--p-pill)',
                      color: 'var(--p-primary)',
                      fontSize: 11.5,
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.icon}
                    {s.label}
                  </span>
                ))}
              </div>
              {editable && (
                <EditPin onClick={edit('socials')} label="Editar redes sociais" position={{ top: 8, right: -10 }} />
              )}
            </div>
          ) : (
            editable && <EmptySlot onClick={edit('socials')} label="Adicionar redes sociais" />
          )}
        </div>
      </div>
    </div>
  );
}

export default BusinessPreview;
