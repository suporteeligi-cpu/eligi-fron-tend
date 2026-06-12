'use client'
// src/features/agenda/components/shared/BookingSeals.tsx
// Pilha de selos do card de agendamento, canto superior direito.
// Ordem: Pago -> Online -> Preferencia -> Nao compareceu
//
// ADAPTATIVO (jun/2026): o tamanho do selo escala com a altura do card.
//  - card alto  -> selo no MAX (18px), ancorado no topo direito (canonico)
//  - card curto -> selo encolhe pra caber com folga simetrica (top=bottom=GAP),
//                  ficando visualmente centralizado na linha unica - sem corte.
// Passe cardHeight (px) do consumidor (BookingCard.totalHeight / MobileBookingCard.height).
import { Rocket, Heart, EyeOff } from 'lucide-react'

interface Props {
  isPaid?:                 boolean
  fromOnline?:             boolean
  professionalPreference?: boolean
  isNoShow?:               boolean
  hidden?:                 boolean
  cardHeight?:             number   // altura do card em px - selos escalam proporcionalmente
}

const MAX_SIZE = 18   // tamanho cheio (cards altos)
const MIN_SIZE = 11   // piso de legibilidade (cards curtos)
const GAP      = 4    // margem do canto + folga vertical de cada lado

// Cabe dentro da altura com folga simetrica (GAP em cima e embaixo).
// Sem cardHeight, assume o tamanho cheio (compativel com chamadas antigas).
function computeSize(cardHeight?: number): number {
  if (!cardHeight || cardHeight <= 0) return MAX_SIZE
  const fit = cardHeight - GAP * 2
  return Math.max(MIN_SIZE, Math.min(MAX_SIZE, fit))
}

function Badge({ bg, size, children }: { bg: string; size: number; children: React.ReactNode }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `${size >= 14 ? 1.5 : 1}px solid rgba(255,255,255,0.92)`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
      boxSizing: 'border-box',
    }}>
      {children}
    </div>
  )
}

function PaidSeal({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
      {/* SVG escala sozinho via width/height; texto e path acompanham o viewBox */}
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <path d="M4 2h16v20l-2.7-1.6L14.7 22 12 20.4 9.3 22 6.7 20.4 4 22V2z" fill="#00b80c" />
        <text x="12" y="16.5" textAnchor="middle" fontSize="13" fontWeight="900" fill="#fff" fontFamily="system-ui, sans-serif">$</text>
      </svg>
    </div>
  )
}

export default function BookingSeals({
  isPaid, fromOnline, professionalPreference, isNoShow, hidden, cardHeight,
}: Props) {
  if (hidden) return null

  const size    = computeSize(cardHeight)
  const overlap = Math.round(size * 0.28)   // sobreposicao escala junto (~5 em 18px)
  const iconSz  = Math.round(size * 0.6)    // icone interno escala junto (~11 em 18px)

  const seals: React.ReactNode[] = []
  if (isPaid)                 seals.push(<PaidSeal key="paid" size={size} />)
  if (fromOnline)             seals.push(<Badge key="online" bg="#2563eb" size={size}><Rocket size={iconSz} color="#fff" strokeWidth={2.4} /></Badge>)
  if (professionalPreference) seals.push(<Badge key="pref"   bg="#e11d48" size={size}><Heart  size={iconSz} color="#fff" fill="#fff" strokeWidth={2} /></Badge>)
  if (isNoShow)               seals.push(<Badge key="noshow" bg="#475569" size={size}><EyeOff size={iconSz} color="#fff" strokeWidth={2.4} /></Badge>)

  if (seals.length === 0) return null

  return (
    <div aria-hidden style={{
      position: 'absolute', top: GAP, right: GAP, zIndex: 3,
      display: 'flex', flexDirection: 'row', alignItems: 'center',
      pointerEvents: 'none',
    }}>
      {seals.map((node, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -overlap, zIndex: 20 - i }}>
          {node}
        </div>
      ))}
    </div>
  )
}
