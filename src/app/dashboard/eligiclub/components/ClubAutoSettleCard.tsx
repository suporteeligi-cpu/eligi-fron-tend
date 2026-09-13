'use client'
// src/app/dashboard/eligiclub/components/ClubAutoSettleCard.tsx
//
// Configuracao do fechamento automatico do pote.
//
// Direcao A (escolhida): o periodo E o mes, sempre. O lojista configura apenas
// em QUE DIA do mes seguinte o periodo encerrado fecha sozinho. Periodo
// configuravel de verdade (semanal/quinzenal/dia de inicio) exigiria migrar o
// ClubFicha.periodKey, que hoje e 'YYYY-MM' carimbado na criacao da ficha.
//
// O automatico NUNCA fecha mes em andamento - so o periodo ja encerrado.

import { useState, useEffect, useCallback } from 'react'
import { CalendarClock, Check, Loader2 } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, transitions } from '@/shared/theme'

const DIAS = [1, 5, 10]

interface ClubSettings {
  autoSettleEnabled: boolean
  autoSettleDay: number | null
}

function proximoFechamento(dia: number): string {
  const k = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit',
  }).format(new Date())
  const ano = Number(k.slice(0, 4))
  const mes = Number(k.slice(5, 7))
  const proxMes = mes === 12 ? 1 : mes + 1
  const proxAno = mes === 12 ? ano + 1 : ano
  return `${String(dia).padStart(2, '0')}/${String(proxMes).padStart(2, '0')}/${proxAno}`
}

export default function ClubAutoSettleCard({ onToast }: { onToast: (m: string) => void }) {
  const [settings, setSettings] = useState<ClubSettings>({ autoSettleEnabled: false, autoSettleDay: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // setState apenas dentro dos callbacks da promise (React Compiler: nada
  // sincrono no corpo do efeito).
  useEffect(() => {
    const ctrl = new AbortController()
    api.get('/club-settlements/settings', { signal: ctrl.signal })
      .then(res => {
        if (ctrl.signal.aborted) return
        const payload = (res.data?.data ?? res.data) as ClubSettings | null
        if (payload) setSettings(payload)
      })
      .catch(() => { /* sem config = defaults desligados */ })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false) })
    return () => ctrl.abort()
  }, [])

  const salvar = useCallback(async (next: ClubSettings) => {
    setSettings(next)
    setSaving(true)
    try {
      await api.put('/club-settlements/settings', next)
      onToast(next.autoSettleEnabled
        ? `Fechamento automatico no dia ${next.autoSettleDay} ✓`
        : 'Fechamento automatico desligado ✓')
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'response' in err)
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Nao foi possivel salvar')
        : 'Nao foi possivel salvar'
      onToast(msg)
    } finally {
      setSaving(false)
    }
  }, [onToast])

  if (loading) return null

  const ligado = settings.autoSettleEnabled
  const dia = settings.autoSettleDay

  return (
    <div style={{
      marginTop: 18, background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      border: '1px solid rgba(255,255,255,0.6)', borderRadius: 18, padding: '18px 20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 740, letterSpacing: '-0.02em', color: colors.gray[900] }}>
            Fechar sozinho todo mes
          </h3>
          <p style={{ margin: 0, fontSize: 11.5, color: colors.gray.dimText, lineHeight: 1.5 }}>
            So fecha mes ja terminado. O mes em andamento nunca e tocado.
          </p>
        </div>
        <button
          role="switch"
          aria-checked={ligado}
          aria-label="Fechar automaticamente"
          disabled={saving}
          onClick={() => salvar({
            autoSettleEnabled: !ligado,
            autoSettleDay: !ligado ? (dia ?? 5) : dia,
          })}
          style={{
            width: 52, height: 32, borderRadius: 999, border: 'none', flexShrink: 0,
            background: ligado ? '#10B981' : 'rgba(17,17,20,0.14)',
            position: 'relative', cursor: saving ? 'not-allowed' : 'pointer',
            transition: `background ${transitions.fast}`, WebkitTapHighlightColor: 'transparent',
          }}>
          <span style={{
            position: 'absolute', top: 3, left: 3, width: 26, height: 26, borderRadius: '50%',
            background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transform: ligado ? 'translateX(20px)' : 'none', transition: `transform ${transitions.fast}`,
          }} />
        </button>
      </div>

      {ligado && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            {DIAS.map(d => {
              const ativo = dia === d
              return (
                <button key={d} disabled={saving}
                  aria-pressed={ativo}
                  onClick={() => salvar({ autoSettleEnabled: true, autoSettleDay: d })}
                  style={{
                    minHeight: 44, padding: '0 16px', borderRadius: 12,
                    border: `1px solid ${ativo ? colors.gray[900] : colors.gray.borderMd}`,
                    background: ativo ? colors.gray[900] : '#fff',
                    color: ativo ? '#fff' : colors.gray[900],
                    fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    transition: `all ${transitions.fast}`, WebkitTapHighlightColor: 'transparent',
                  }}>
                  <span style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{d}</span>
                  do mes seguinte
                </button>
              )
            })}
          </div>

          {dia !== null && (
            <div style={{
              marginTop: 14, padding: '13px 14px', borderRadius: 12,
              background: 'rgba(15,110,86,0.07)', border: '1px solid rgba(15,110,86,0.18)',
              display: 'flex', alignItems: 'center', gap: 9,
              fontSize: 13, color: '#0F6E56',
            }}>
              {saving
                ? <Loader2 size={15} style={{ animation: 'club-spin .8s linear infinite', flexShrink: 0 }} />
                : <CalendarClock size={15} strokeWidth={2.2} style={{ flexShrink: 0 }} />}
              <span>
                O mes atual fecha sozinho em{' '}
                <b style={{ fontVariantNumeric: 'tabular-nums' }}>{proximoFechamento(dia)}</b>.
              </span>
              {!saving && <Check size={14} strokeWidth={2.6} style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.55 }} />}
            </div>
          )}
        </>
      )}
    </div>
  )
}
