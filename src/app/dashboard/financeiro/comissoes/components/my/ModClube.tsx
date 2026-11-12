// src/app/dashboard/financeiro/comissoes/components/my/ModClube.tsx
// @eligi:mc-d-club — sua parte do pote do EligiClub (GET /club-settlements/commissions).
'use client'

import EligiClubIcon from '@/app/components/navigation/EligiClubIcon'
import { MONTHS } from './mcFormat'
import { Money, MoneyFlat } from './mcParts'
import { OK, WARN } from './mcStyles'
import type { ClubStaffResp } from './mcTypes'

function periodLabel(key: string) {
  const [y, m] = key.split('-')
  const full = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return `${full[Number(m) - 1] ?? MONTHS[Number(m) - 1] ?? m} ${y}`
}

export function clubUnpaid(club: ClubStaffResp | null): number {
  if (!club) return 0
  return club.periods.filter(p => !p.myItemPaidAt).reduce((s, p) => s + p.myAmount, 0)
}

export function ModClube({ club, status }: { club: ClubStaffResp | null; status: 'loading' | 'ok' | 'error' }) {
  if (status === 'loading') {
    return <div className="mcw-card" style={{ padding: 16 }}><div className="mc-sk" style={{ width: '50%', height: 14 }} /><div className="mc-sk" style={{ width: '70%', height: 32, marginTop: 12 }} /></div>
  }
  if (status === 'error') {
    return <div className="mcw-card mcw-empty"><b>Não deu para carregar o clube</b>Feche e abra de novo daqui a pouco.</div>
  }
  if (!club || club.periods.length === 0) {
    return (
      <div className="mcw-card mcw-empty">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><EligiClubIcon size={28} color="#111114" /></div>
        <b>Você ainda não tem comissões do EligiClub</b>
        Sua parte do pote aparece aqui quando um período for fechado.
      </div>
    )
  }
  const n = club.periods.length
  return (
    <>
      <div className="mcw-card" style={{ padding: '14px 16px' }}>
        <span className="mc-eyebrow">Recebido do clube</span>
        <div style={{ fontSize: 30, fontWeight: 600, marginTop: 6, lineHeight: 1 }}><Money v={club.totalAmount} /></div>
        <div className="mc-fnt" style={{ fontSize: 12, marginTop: 6 }}>
          {n} período{n !== 1 ? 's' : ''} fechado{n !== 1 ? 's' : ''} · {club.totalFichas} fichas suas
        </div>
      </div>
      <div className="mcw-card">
        {club.periods.map(p => (
          <div key={p.periodKey} className="mcw-paid">
            <div className="mc-min0" style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{periodLabel(p.periodKey)}</div>
              <div className="mc-fnt" style={{ fontSize: 12 }}>{p.myFichas} fichas · {p.myPct}% do pote</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <MoneyFlat v={p.myAmount} />
              <div style={{ fontSize: 12, fontWeight: 600, color: p.myItemPaidAt ? OK : WARN }}>
                {p.myItemPaidAt ? `Pago ${p.myItemPaidAt.slice(8, 10)}/${p.myItemPaidAt.slice(5, 7)}` : 'A receber'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
