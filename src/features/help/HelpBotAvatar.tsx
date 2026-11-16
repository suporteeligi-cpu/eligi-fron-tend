// src/features/help/HelpBotAvatar.tsx
// @eligi:help-avatar
//
// A Gi: foto oficial do mascote (public/images/help/gi.webp, 192px, ~9 KB).
// Fundo em CSS (background-image, classe .ehb no HelpWidget) para nao cair no
// aviso de <img> do Next. `online` poe o ponto verde no canto (cabecalho).

export default function HelpBotAvatar({ size = 40, online = false }: { size?: number; online?: boolean }) {
  return (
    <span className="ehb" style={{ width: size, height: size }} aria-hidden="true">
      {online && <span className="ehb-on" />}
    </span>
  )
}
