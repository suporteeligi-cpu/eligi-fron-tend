// src/features/anamnesis/components/RecordSheet.tsx
// @eligi:anamnese-front-ficha
// Ficha preenchida. Abrir ja e um acesso registrado no back (log de VIEW antes
// da resposta), entao a folha so busca quando abre. Exclusao a pedido do
// cliente (LGPD): as respostas somem, fica so o registro de que existiu.
'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Lock } from 'lucide-react'
import Sheet from '@/shared/components/Sheet'
import { apiMessage, apiStatus, eraseRecord, fetchRecord } from '../api'
import { fmtDate, fmtDateOnly, fmtDateTime, isYesNo } from '../format'
import type { AnamnesisQuestion, AnswerValue, RecordDetail } from '../types'

interface Props {
  recordId: string
  clientName: string
  canErase: boolean
  onClose: () => void
  onErased: (id: string) => void
}

type Loaded =
  | { id: string; ok: true; record: RecordDetail }
  | { id: string; ok: false; message: string }

function errorText(e: unknown): string {
  const s = apiStatus(e)
  if (s === 403) return 'Você não tem acesso às respostas desta ficha.'
  if (s === 410) return 'Esta ficha foi excluída a pedido do cliente.'
  if (s === 404) return 'Ficha não encontrada.'
  return apiMessage(e, 'Não foi possível abrir a ficha.')
}

export default function RecordSheet({ recordId, clientName, canErase, onClose, onErased }: Props) {
  const [data, setData] = useState<Loaded | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [erasing, setErasing] = useState(false)
  const [eraseError, setEraseError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchRecord(recordId).then(
      (record) => { if (alive) setData({ id: recordId, ok: true, record }) },
      (e) => { if (alive) setData({ id: recordId, ok: false, message: errorText(e) }) },
    )
    return () => { alive = false }
  }, [recordId])

  const current = data && data.id === recordId ? data : null
  const record = current?.ok ? current.record : null

  async function handleErase() {
    setErasing(true)
    setEraseError(null)
    try {
      await eraseRecord(recordId)
      onErased(recordId)
      onClose()
    } catch (e) {
      setEraseError(apiMessage(e, 'Não foi possível excluir agora. Tente de novo.'))
      setErasing(false)
    }
  }

  const footer = canErase && record ? (
    confirming ? (
      <div className="an-erase">
        <p className="an-erase-text">
          As respostas e o termo aceito somem para sempre. Fica só o registro de que a ficha existiu.
        </p>
        {eraseError && <p className="an-erase-err" role="alert">{eraseError}</p>}
        <div className="an-erase-acts">
          <button type="button" className="an-btn-ghost" onClick={() => { setConfirming(false); setEraseError(null) }} disabled={erasing}>
            Cancelar
          </button>
          <button type="button" className="an-btn-danger" onClick={handleErase} disabled={erasing}>
            {erasing ? 'Excluindo…' : 'Excluir definitivamente'}
          </button>
        </div>
      </div>
    ) : (
      <button type="button" className="an-btn-link-danger" onClick={() => setConfirming(true)}>
        Excluir a pedido do cliente
      </button>
    )
  ) : undefined

  return (
    <Sheet
      title={record?.client.name ?? clientName}
      subtitle={record ? record.templateName : 'Ficha de anamnese'}
      onClose={onClose}
      footer={footer}
    >
      <style>{CSS}</style>

      {!current && (
        <div aria-busy="true">
          <div className="an-skel" style={{ height: 52, marginBottom: 14 }} />
          {[0, 1, 2, 3].map((i) => <div key={i} className="an-skel" style={{ height: 40, marginBottom: 10 }} />)}
        </div>
      )}

      {current && !current.ok && (
        <div className="an-sheet-state" role="alert">
          <Lock size={20} />
          <p>{current.message}</p>
        </div>
      )}

      {record && <RecordBody record={record} />}
    </Sheet>
  )
}

function RecordBody({ record }: { record: RecordDetail }) {
  const alertIds = new Set(record.alerts.map((a) => a.questionId))
  const expired = record.status === 'EXPIRED'
  const who = record.filledBy === 'CLIENT' ? 'pelo cliente' : record.filledByName ? `por ${record.filledByName}` : 'pela equipe'

  return (
    <>
      <div className="an-meta">
        <div>
          <div className="an-meta-k">PREENCHIDA</div>
          <div className="an-meta-v">{fmtDateTime(record.completedAt)}</div>
          <div className="an-meta-s">{who}</div>
        </div>
        <div>
          <div className="an-meta-k">{expired ? 'VENCEU' : 'VÁLIDA ATÉ'}</div>
          <div className={`an-meta-v${expired ? ' is-warn' : ''}`}>{fmtDate(record.expiresAt)}</div>
          {expired && <div className="an-meta-s">Peça uma ficha nova antes do atendimento.</div>}
        </div>
      </div>

      {record.alerts.length > 0 && (
        <section className="an-alerts" aria-label="Alertas de saúde">
          <div className="an-alerts-h"><AlertTriangle size={16} /> Atenção antes do atendimento</div>
          <ul>
            {record.alerts.map((a) => (
              <li key={a.questionId}>
                <strong>{a.label}</strong>
                {a.detail ? <span> — {a.detail}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Respostas">
        <h3 className="an-h3">Respostas</h3>
        <dl className="an-answers">
          {record.questions.map((q) => (
            <div key={q.id} className={`an-ans${alertIds.has(q.id) ? ' is-alert' : ''}`}>
              <dt>{q.label}</dt>
              <dd><Answer q={q} v={record.answers[q.id]} /></dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="Termo de consentimento">
        <h3 className="an-h3">Termo de consentimento</h3>
        {record.consentText ? <p className="an-consent">{record.consentText}</p> : null}
        <p className="an-consent-at">Aceito em {fmtDateTime(record.consentAt)}</p>
      </section>
    </>
  )
}

function Answer({ q, v }: { q: AnamnesisQuestion; v: AnswerValue | undefined }) {
  if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) {
    return <span className="an-none">Sem resposta</span>
  }
  if (isYesNo(v)) {
    return (
      <>
        <span className="an-yn">{v.value ? 'Sim' : 'Não'}</span>
        {v.value && v.detail ? (
          <span className="an-detail">{q.detailLabel ? `${q.detailLabel} ` : ''}{v.detail}</span>
        ) : null}
      </>
    )
  }
  if (Array.isArray(v)) return <span>{v.join(', ')}</span>
  if (typeof v === 'string') return <span className="an-text">{q.type === 'date' ? fmtDateOnly(v) : v}</span>
  return <span className="an-none">Sem resposta</span>
}

// .an-skel e .an-btn-ghost vem do CSS da pagina (AnamnesisModule).
const CSS = `
.an-sheet-state{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:28px 8px;color:#4b4b52}
.an-sheet-state p{margin:0;font-size:14.5px;color:#4b4b52}
.an-meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f5f5f7;border-radius:14px;padding:12px 14px;margin-bottom:14px}
.an-meta-k{font-family:var(--font-mono);font-size:10.5px;font-weight:600;letter-spacing:.1em;color:#8a8a93}
.an-meta-v{font-family:var(--font-display);font-size:16px;font-weight:700;letter-spacing:-.02em;color:#111114;margin-top:2px;font-variant-numeric:tabular-nums}
.an-meta-v.is-warn{color:#b45309}
.an-meta-s{font-size:12.5px;color:#8a8a93;margin-top:2px}
.an-alerts{background:rgba(220,38,38,.07);border:1px solid rgba(220,38,38,.22);border-radius:14px;padding:12px 14px;margin-bottom:16px}
.an-alerts-h{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:700;color:#a32d2d}
.an-alerts ul{margin:8px 0 0;padding-left:20px}
.an-alerts li{font-size:14px;color:#111114;margin:3px 0;line-height:1.4}
.an-alerts li span{color:#4b4b52}
.an-h3{font-family:var(--font-display);font-size:16px;font-weight:700;letter-spacing:-.02em;color:#111114;margin:6px 0 8px}
.an-answers{margin:0 0 16px}
.an-ans{padding:10px 0;border-bottom:1px solid rgba(17,17,20,.07)}
.an-ans:last-child{border-bottom:0}
.an-ans dt{font-size:13px;color:#4b4b52;line-height:1.35}
.an-ans dd{margin:3px 0 0;font-size:15px;color:#111114;line-height:1.4;display:flex;flex-direction:column;gap:2px}
.an-ans.is-alert dd .an-yn{color:#a32d2d;font-weight:700}
.an-yn{font-weight:600}
.an-detail{font-size:14px;color:#4b4b52}
.an-text{white-space:pre-wrap;word-break:break-word}
.an-none{color:#8a8a93;font-size:14px}
.an-consent{margin:0;font-size:13.5px;line-height:1.5;color:#4b4b52;white-space:pre-wrap;background:#f5f5f7;border-radius:12px;padding:12px 14px}
.an-consent-at{margin:8px 0 4px;font-size:12.5px;color:#8a8a93}
.an-btn-link-danger{min-height:44px;width:100%;border:1px solid rgba(220,38,38,.28);background:#fff;color:#b91c1c;border-radius:12px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer}
.an-btn-link-danger:hover{background:rgba(220,38,38,.05)}
.an-erase-text{margin:0 0 10px;font-size:13.5px;color:#4b4b52;line-height:1.45}
.an-erase-err{margin:0 0 10px;font-size:13.5px;color:#a32d2d}
.an-erase-acts{display:flex;gap:8px}
.an-erase-acts>*{flex:1}
.an-btn-danger{min-height:44px;border-radius:12px;border:0;background:#dc2626;color:#fff;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer}
.an-btn-danger:hover{background:#b91c1c}
.an-btn-ghost:disabled,.an-btn-danger:disabled{opacity:.6;cursor:not-allowed}
`
