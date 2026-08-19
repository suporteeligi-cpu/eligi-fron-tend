'use client';

// src/features/settings/components/BusinessPreview.tsx
//
// @eligi:business-preview-componente
// Espelho do link publico (app.eligi.com.br/<slug>) dentro do dashboard.
//
// Nasceu como a funcao `Preview` dentro do ProfileThemeEditor e foi extraido
// quando passou a precisar mostrar sobre/endereco/redes/fotos — o editor tinha
// 559 linhas e o preview e' o heroi da tela, nao um detalhe dela.
//
// CONTRATO: componente PURO. Recebe tudo por prop, nao faz fetch, nao guarda
// estado. Quem edita e' o parent; aqui so' se desenha o resultado.
//
// As CSS variables sao derivadas por `deriveTheme` (fonte unica em
// shared/profileTheme.ts) e aplicadas no wrapper — nenhum calculo de cor ou
// contraste vive aqui. Dois calculos seriam duas verdades.

import { Instagram, Phone, Globe, MapPin } from 'lucide-react';
import {
  type BusinessTheme,
  type BusinessSocials,
  deriveTheme,
  coverBackground,
  isMonogramCover,
} from '@/shared/profileTheme';

/** Iniciais do negocio, usadas sem logo e na marca-d'agua do monograma. */
export function initialsOf(name: string): string {
  const t = (name || '').trim();
  if (!t) return 'E';
  return t.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
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
}: Props) {
  const vars = deriveTheme(theme);
  const cover = coverBackground(coverUrl, theme.primary);
  const watermark = isMonogramCover(coverUrl);
  const ini = initialsOf(businessName);

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
          <div
            style={{
              position: 'relative',
              zIndex: 1,
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

          {aboutText && (
            <p
              style={{
                margin: '14px 0 0',
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
          )}

          {addressText && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 7,
                marginTop: 12,
                fontSize: 12.5,
                lineHeight: 1.4,
                color: 'var(--p-muted)',
              }}
            >
              <MapPin size={14} style={{ flex: 'none', marginTop: 1, color: 'var(--p-accent)' }} />
              <span>{addressText}</span>
            </div>
          )}

          {photos.length > 0 && (
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

          {socialItems.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 7,
                marginTop: 16,
                paddingTop: 14,
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
          )}
        </div>
      </div>
    </div>
  );
}

export default BusinessPreview;
