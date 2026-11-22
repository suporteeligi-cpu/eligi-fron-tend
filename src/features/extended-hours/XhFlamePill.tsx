'use client'
// src/features/extended-hours/XhFlamePill.tsx
// @eligi:xh-fe-pill — botao de fogo na agenda (direcao B).
// Desligado e na epoca (≈45 dias antes do periodo padrao ate o fim): pulsa e
// abre o simulador. Ligado: fica calmo ("Fila até 23:00") e leva a Configuracoes.
// Quem nao pode configurar (403 do back) nao ve nada: o front nao repete a
// lista de cargos. Fora da epoca e desligado, nada aparece.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FlameIcon, XH_CSS } from './ui'
import XhSimulator from './XhSimulator'
import { fetchXh, errorStatus, inSeason, isRunning, type XhDto } from './api'

const CFG_HREF = '/dashboard/configuracoes/modo-dezembro'

export default function XhFlamePill() {
  const router = useRouter()
  const [dto, setDto] = useState<XhDto | null>(null)
  const [sim, setSim] = useState(false)

  useEffect(() => {
    let vivo = true
    fetchXh()
      .then((d) => { if (vivo) setDto(d) })
      .catch((e) => {
        // 403 = cargo sem acesso (esperado). O resto vai para o log.
        if (errorStatus(e) !== 403) console.error('[modo-dezembro] pilula', e)
      })
    return () => { vivo = false }
  }, [])

  if (!dto) return null
  const running = isRunning(dto)
  if (!running && !inSeason(dto)) return null

  const cfg = dto.config
  const limit = cfg?.limitTime ?? dto.defaults.limitTime
  const firstPro = dto.professionals.find((p) => cfg?.professionalIds.includes(p.id)) ?? dto.professionals[0] ?? null

  return (
    <>
      <style>{XH_CSS}</style>
      {running ? (
        <button
          type="button"
          className="xh-pill on"
          onClick={() => router.push(CFG_HREF)}
          aria-label={`Modo Dezembro ligado: fila até ${limit}. Abrir configuração`}
        >
          <span className="xh-pill-ic"><FlameIcon size={22} /></span>
          <span>Fila até {limit}</span>
        </button>
      ) : (
        <button
          type="button"
          className="xh-pill invite"
          onClick={() => setSim(true)}
          aria-label="Modo Dezembro: ver como funciona"
        >
          <span className="xh-pill-ic" aria-hidden>
            <span className="xh-spark" style={{ left: 4, top: 2 }} />
            <span className="xh-spark" style={{ left: 14, top: 4, animationDelay: '.6s' }} />
            <span className="xh-spark" style={{ left: 9, top: 0, animationDelay: '1.2s' }} />
            <FlameIcon size={22} color="#fff" className="xh-flame" />
          </span>
          <span>Modo Dezembro</span>
        </button>
      )}
      {sim && (
        <XhSimulator
          closeAt={firstPro?.closesAt ?? '20:00'}
          limit={limit}
          proName={firstPro ? firstPro.name.split(' ')[0] : null}
          onClose={() => setSim(false)}
          onActivate={() => { setSim(false); router.push(CFG_HREF) }}
          activateLabel="Ativar no meu negócio"
        />
      )}
    </>
  )
}
