'use client'
// src/features/agenda/components/shared/BookingSeals.tsx
// Pilha de selos do card de agendamento, canto superior direito.
// Ordem: EligiClub (globo) -> Pago ($) -> Online (rocket) -> Preferencia (heart) -> Nao compareceu (eye-off)
//
// ADAPTATIVO: o tamanho do selo escala com a altura do card (computeSize).
//  - card alto  -> selo no MAX (18px), ancorado no topo direito (canonico)
//  - card curto -> selo encolhe pra caber com folga simetrica - sem corte.
//
// SELO DO CLUBE (jun/2026): o globo tem VIDA PROPRIA. Ele ignora o `hidden`
// (que esconde os demais em cards minimos) e tem piso proprio (GLOBE_MIN=9),
// entao sobrevive ate o card de 5min. Visual HIBRIDO: globo "rico" (Americas
// prata + Africa vermelha) quando o badge e >=14px; globo de linha (mais
// legivel) abaixo disso. Os demais selos seguem EXATAMENTE o comportamento
// anterior - nada neles mudou.
import { useId } from 'react'
import { Rocket, Heart, EyeOff } from 'lucide-react'

interface Props {
  isPaid?:                 boolean
  fromOnline?:             boolean
  professionalPreference?: boolean
  isNoShow?:               boolean
  hidden?:                 boolean
  cardHeight?:             number   // altura do card em px - selos escalam proporcionalmente
  hasClub?:                boolean  // cliente tem EligiClub ativo (globo, vida propria)
}

const MAX_SIZE  = 18   // tamanho cheio (cards altos)
const MIN_SIZE  = 11   // piso de legibilidade dos selos comuns (cards curtos)
const GLOBE_MIN = 9    // piso do globo - desce mais que os outros (cabe no card de 5min)
const GAP       = 4    // margem do canto + folga vertical de cada lado

// Cabe dentro da altura com folga simetrica (GAP em cima e embaixo).
// Sem cardHeight, assume o tamanho cheio (compativel com chamadas antigas).
function computeSize(cardHeight?: number): number {
  if (!cardHeight || cardHeight <= 0) return MAX_SIZE
  const fit = cardHeight - GAP * 2
  return Math.max(MIN_SIZE, Math.min(MAX_SIZE, fit))
}

// O globo tem piso menor (GLOBE_MIN) p/ sobreviver em cards minimos.
function computeGlobeSize(cardHeight?: number): number {
  if (!cardHeight || cardHeight <= 0) return MAX_SIZE
  return Math.max(GLOBE_MIN, Math.min(MAX_SIZE, cardHeight - GAP))
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

// Globo do EligiClub. HIBRIDO: rico (Americas/Africa) em selo grande, linha no pequeno.
// clipPath com id unico por instancia via useId (evita colisao entre varios cards).
function GlobeMark({ badge }: { badge: number }) {
  const uid = useId()
  const big = badge >= 14
  const s   = Math.round(badge * (big ? 0.82 : 0.62))

  if (!big) {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    )
  }

  const cid = `egc-${uid.replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <defs><clipPath id={cid}><circle cx="12" cy="12" r="11" /></clipPath></defs>
      <circle cx="12" cy="12" r="11" fill="#16161e" />
      <g clipPath={`url(#${cid})`}>
        <path d="M7 6 C5.5 6 5 7 5.5 8.4 C5 9.6 6 10.5 7.2 10 C6.8 11.2 8 12 9 11.2 C10 12.6 9.6 14.6 10.6 16.4 C11.2 17.6 11.8 18.6 10.8 19 C9.8 18.4 9.6 16 8.4 14 C7.2 11.6 6 9 7 6Z" fill="#e8e8ec" />
        <path d="M13 6.5 C12.2 7 12.6 8 13.6 7.8 C13.2 9 14 10 15.2 9.5 C16 11 15.6 13 14.6 14.8 C13.8 16 14.6 16.8 15.4 16 C16.6 14.4 16.4 11.6 17 9.6 C17.4 8 16.6 6.6 15 6.8 C14.2 6.4 13.8 6 13 6.5Z" fill="#e11d1d" />
      </g>
      <circle cx="12" cy="12" r="11" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
      <ellipse cx="9" cy="8" rx="4" ry="2.4" fill="rgba(255,255,255,0.14)" transform="rotate(-20 9 8)" />
    </svg>
  )
}

export default function BookingSeals({
  isPaid, fromOnline, professionalPreference, isNoShow, hidden, cardHeight, hasClub,
}: Props) {
  const items: { size: number; node: React.ReactNode }[] = []

  // 1) Globo do clube - PRIMEIRO e com vida propria: aparece mesmo com `hidden`.
  if (hasClub) {
    const gs = computeGlobeSize(cardHeight)
    items.push({
      size: gs,
      node: <Badge bg="#dc2626" size={gs}><GlobeMark badge={gs} /></Badge>,
    })
  }

  // 2) Demais selos - comportamento INALTERADO: somem quando `hidden`.
  if (!hidden) {
    const size     = computeSize(cardHeight)
    const iconSz   = Math.round(size * 0.6)
    const dollarSz = Math.round(size * 0.7)
    if (isPaid)                 items.push({ size, node:
      <Badge bg="#00b80c" size={size}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: dollarSz, lineHeight: 1, fontFamily: 'system-ui, sans-serif' }}>$</span>
      </Badge> })
    if (fromOnline)             items.push({ size, node: <Badge bg="#2563eb" size={size}><Rocket size={iconSz} color="#fff" strokeWidth={2.4} /></Badge> })
    if (professionalPreference) items.push({ size, node: <Badge bg="#e11d48" size={size}><Heart  size={iconSz} color="#fff" fill="#fff" strokeWidth={2} /></Badge> })
    if (isNoShow)               items.push({ size, node: <Badge bg="#475569" size={size}><EyeOff size={iconSz} color="#fff" strokeWidth={2.4} /></Badge> })
  }

  if (items.length === 0) return null

  return (
    <div aria-hidden style={{
      position: 'absolute', top: GAP, right: GAP, zIndex: 3,
      display: 'flex', flexDirection: 'row', alignItems: 'center',
      pointerEvents: 'none',
    }}>
      {items.map((it, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -Math.round(it.size * 0.28), zIndex: 20 - i }}>
          {it.node}
        </div>
      ))}
    </div>
  )
}