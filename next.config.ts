import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // @eligi:image-formats
  // AVIF primeiro, WebP como fallback. Sem isso o Next 16 so gera WebP.
  // Print de UI densa e o pior caso para PNG: AVIF costuma cair 60-75%.
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 640, 828, 1080, 1200, 1440, 1920, 2560],
    minimumCacheTTL: 604800
  },

  async headers() {
    return [
      // @eligi:cache-static-immutable
      // Build assets do Next sao content-hashed: cache eterno e seguro.
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Saida do otimizador de imagem. Chave = src + width + quality, entao
      // trocar um arquivo mantendo o mesmo nome serve versao velha ate expirar.
      // Regra do projeto: asset novo entra com nome versionado (-v2, -v3).
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=2592000'
          }
        ]
      },
      // Arquivos servidos direto de public/images (sem passar pelo otimizador).
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=2592000'
          }
        ]
      },
      {
        source: '/:path((?!_next/static|_next/image|images/).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      }
    ]
  }
}

export default nextConfig