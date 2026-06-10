'use client'
// src/features/agenda/components/shared/BookingSeals.tsx
// Pilha de selos do card de agendamento, canto superior direito.
// Ordem (esquerda → direita): Pago (💲) → Online (🚀) → Preferência de prof. (❤️).
// Sobreposição HORIZONTAL (lado a lado, leve overlap) — cresce pra esquerda,
// ancorado no canto direito, pra não estourar a altura em cards curtos.

import { Rocket, Heart } from 'lucide-react'

interface Props {
  isPaid?:                 boolean
  fromOnline?:             boolean   // veio do link público
  professionalPreference?: boolean   // cliente escolheu o profissional
  /** Esconde tudo (ex.: card micro, sem espaço). */
  hidden?:                 boolean
}

const SIZE = 18 // diâmetro do selo
const OVERLAP = 5 // px de sobreposição entre selos

function Badge({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div style={{
      width: SIZE, height: SIZE, borderRadius: '50%',
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1.5px solid rgba(255,255,255,0.92)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
      boxSizing: 'border-box',
    }}>
      {children}
    </div>
  )
}

function PaidSeal() {
  // Nota/recibo branca preenchida + cifrão (mesmo desenho do selo "Pago" original)
  return (
    <div style={{ width: SIZE, height: SIZE, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
      <svg viewBox="0 0 24 24" width={SIZE} height={SIZE}>
        <path d="M4 2h16v20l-2.7-1.6L14.7 22 12 20.4 9.3 22 6.7 20.4 4 22V2z" fill="#00b80c" />
        <text x="12" y="16.5" textAnchor="middle" fontSize="13" fontWeight="900" fill="#fff" fontFamily="system-ui, sans-serif">$</text>
      </svg>
    </div>
  )
}

export default function BookingSeals({ isPaid, fromOnline, professionalPreference, hidden }: Props) {
  if (hidden) return null

  const seals: React.ReactNode[] = []
  if (isPaid) seals.push(<PaidSeal />)
  if (fromOnline) seals.push(<Badge bg="#2563eb"><Rocket size={11} color="#fff" strokeWidth={2.4} /></Badge>)
  if (professionalPreference) seals.push(<Badge bg="#e11d48"><Heart size={11} color="#fff" fill="#fff" strokeWidth={2} /></Badge>)

  if (seals.length === 0) return null

  return (
    <div aria-hidden style={{
      position: 'absolute', top: 4, right: 4, zIndex: 3,
      display: 'flex', flexDirection: 'row', alignItems: 'center',
      pointerEvents: 'none',
    }}>
      {seals.map((node, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -OVERLAP, zIndex: 20 - i }}>
          {node}
        </div>
      ))}
    </div>
  )
}
