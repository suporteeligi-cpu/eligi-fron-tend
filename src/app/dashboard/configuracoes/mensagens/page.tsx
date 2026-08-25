'use client'
// src/app/dashboard/configuracoes/mensagens/page.tsx
// @eligi:msgtpl-page
//
// Direcao B (split editor + previa) no desktop; empilha como a direcao C no
// mobile via @media — a previa fica logo abaixo do campo e as acoes ficam
// FORA do grid, senao no celular a previa cairia depois dos botoes.
// Sem isMobile em JS: breakpoint puro em CSS.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  MessageSquare,
  Plus,
  Send,
  Star,
  Trash2,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { waShareLink } from '@/shared/utils/whatsapp'
import {
  TEMPLATE_BODY_MAX,
  TEMPLATE_TITLE_MAX,
  TEMPLATE_TOKENS,
  renderTemplate,
} from '@/shared/utils/messageTemplate'
import { publicBookingLabel, publicBookingUrl } from '@/shared/constants/publicUrl'

interface Template {
  id: string
  kind: string
  title: string
  body: string
  isDefault: boolean
  active: boolean
}

const RED = '#dc2626'
const LINE = 'rgba(0,0,0,0.07)'
const INK_2 = 'rgba(0,0,0,0.45)'
const INK_3 = 'rgba(0,0,0,0.30)'
const GREEN = '#1D9E75'

const DEFAULT_TITLE = 'Convite padrao'
const DEFAULT_BODY =
  'Oi, {cliente}! Aqui e da {negocio}.\n\n' +
  'Deixei meu link de agendamento pronto pra voce escolher o melhor horario: {link}\n\n' +
  'Qualquer duvida, e so chamar!'

const PREVIEW_CLIENT = 'Jefferson Silva'

const CSS = `
.msgtpl-split { display: grid; grid-template-columns: 1fr; gap: 18px; }
@media (min-width: 900px) {
  .msgtpl-split { grid-template-columns: 1fr 1fr; }
}
@keyframes msgtplUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
.msgtpl-wa-bubble { white-space: pre-wrap; word-break: break-word; }
`

function cardStyle(): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px)',
    border: `1px solid ${LINE}`,
    borderRadius: 14,
    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
  }
}

function labelStyle(): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    color: INK_3,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 7,
  }
}

export default function MensagensConfigPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState(DEFAULT_TITLE)
  const [body, setBody] = useState(DEFAULT_BODY)

  const [businessSlug, setBusinessSlug] = useState('')
  const [businessName, setBusinessName] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const bodyRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    let alive = true
    api
      .get('/message-templates')
      .then(({ data }) => {
        if (!alive) return
        const list: Template[] = Array.isArray(data?.templates) ? data.templates : []
        setTemplates(list)
        setBusinessSlug(typeof data?.businessSlug === 'string' ? data.businessSlug : '')
        setBusinessName(typeof data?.businessName === 'string' ? data.businessName : '')
        const first = list.find((t) => t.isDefault) ?? list[0]
        if (first) {
          setSelectedId(first.id)
          setTitle(first.title)
          setBody(first.body)
        }
      })
      .catch(() => {
        if (alive) setError('Nao foi possivel carregar suas mensagens.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const link = businessSlug ? publicBookingUrl(businessSlug) : `https://${publicBookingLabel('seu-link')}`

  const preview = useMemo(
    () =>
      renderTemplate(body, {
        cliente: PREVIEW_CLIENT,
        negocio: businessName || 'seu negocio',
        link,
      }),
    [body, businessName, link],
  )

  const overLimit = body.length > TEMPLATE_BODY_MAX
  const canSave = title.trim().length > 0 && body.trim().length > 0 && !overLimit && !saving

  const flashSaved = useCallback(() => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }, [])

  /** Insere o token na posicao do cursor, nao no fim do texto. */
  const insertToken = useCallback((token: string) => {
    const el = bodyRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    setBody((prev) => prev.slice(0, start) + token + prev.slice(end))
    window.requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }, [])

  const selectTemplate = useCallback((tpl: Template) => {
    setSelectedId(tpl.id)
    setTitle(tpl.title)
    setBody(tpl.body)
    setError('')
  }, [])

  const startNew = useCallback(() => {
    setSelectedId(null)
    setTitle('')
    setBody(DEFAULT_BODY)
    setError('')
  }, [])

  const save = useCallback(async () => {
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      const payload = { title: title.trim(), body }
      if (selectedId) {
        const { data } = await api.put(`/message-templates/${selectedId}`, payload)
        setTemplates((prev) => prev.map((t) => (t.id === selectedId ? (data as Template) : t)))
      } else {
        const { data } = await api.post('/message-templates', payload)
        const created = data as Template
        setTemplates((prev) => [...prev, created])
        setSelectedId(created.id)
      }
      flashSaved()
    } catch {
      setError('Nao foi possivel salvar a mensagem.')
    } finally {
      setSaving(false)
    }
  }, [canSave, title, body, selectedId, flashSaved])

  const makeDefault = useCallback(async () => {
    if (!selectedId) return
    try {
      await api.patch(`/message-templates/${selectedId}/default`)
      setTemplates((prev) => prev.map((t) => ({ ...t, isDefault: t.id === selectedId })))
      flashSaved()
    } catch {
      setError('Nao foi possivel definir como padrao.')
    }
  }, [selectedId, flashSaved])

  const removeTemplate = useCallback(async () => {
    if (!selectedId) return
    if (!window.confirm('Excluir esta mensagem?')) return
    try {
      await api.delete(`/message-templates/${selectedId}`)
      const rest = templates.filter((t) => t.id !== selectedId)
      setTemplates(rest)
      const next = rest[0]
      if (next) {
        setSelectedId(next.id)
        setTitle(next.title)
        setBody(next.body)
      } else {
        setSelectedId(null)
        setTitle(DEFAULT_TITLE)
        setBody(DEFAULT_BODY)
      }
    } catch {
      setError('Nao foi possivel excluir a mensagem.')
    }
  }, [selectedId, templates])

  const testOnWhatsapp = useCallback(() => {
    window.open(waShareLink(preview), '_blank', 'noopener,noreferrer')
  }, [preview])

  const counterColor = overLimit ? RED : body.length > TEMPLATE_BODY_MAX * 0.8 ? '#c2410c' : INK_3

  return (
    <>
      <style>{CSS}</style>
      <div
        style={{
          maxWidth: 980,
          animation: 'msgtplUp 0.3s ease',
          fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif',
        }}
      >
        <Link
          href="/dashboard/configuracoes"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 13,
            color: INK_2,
            textDecoration: 'none',
            marginBottom: 16,
          }}
        >
          <ChevronLeft size={16} strokeWidth={2} />
          Configuracoes
        </Link>

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', color: '#0f0f14' }}>
            Mensagens de saudacao
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: INK_2 }}>
            Modelos prontos pra chamar seu cliente no WhatsApp com o seu link de agendamento.
          </p>
        </div>

        {loading ? (
          <div style={{ ...cardStyle(), padding: 40, textAlign: 'center', fontSize: 13, color: INK_2 }}>
            Carregando...
          </div>
        ) : (
          <>
            {templates.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={labelStyle()}>Seus modelos</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {templates.map((tpl) => {
                    const on = tpl.id === selectedId
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => selectTemplate(tpl)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 7,
                          fontSize: 13,
                          fontWeight: 600,
                          padding: '9px 14px',
                          minHeight: 40,
                          borderRadius: 11,
                          cursor: 'pointer',
                          background: on ? RED : '#fff',
                          color: on ? '#fff' : 'rgba(0,0,0,0.65)',
                          border: `1px solid ${on ? RED : LINE}`,
                          transition: 'all 0.18s ease',
                        }}
                      >
                        <MessageSquare size={14} strokeWidth={2} />
                        {tpl.title}
                        {tpl.isDefault && (
                          <Star size={12} strokeWidth={2.4} fill="currentColor" />
                        )}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={startNew}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '9px 14px',
                      minHeight: 40,
                      borderRadius: 11,
                      cursor: 'pointer',
                      background: '#fff',
                      color: RED,
                      border: `1px dashed rgba(220,38,38,0.35)`,
                    }}
                  >
                    <Plus size={14} strokeWidth={2.4} />
                    Adicionar
                  </button>
                </div>
              </div>
            )}

            <div className="msgtpl-split">
              {/* -------- editor -------- */}
              <div style={{ ...cardStyle(), padding: 19 }}>
                <div style={labelStyle()}>Nome do modelo</div>
                <input
                  type="text"
                  value={title}
                  maxLength={TEMPLATE_TITLE_MAX}
                  placeholder="Ex: Convite padrao"
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    border: `1px solid ${LINE}`,
                    borderRadius: 11,
                    padding: '11px 14px',
                    fontSize: 16,
                    outline: 'none',
                    background: '#fff',
                    fontFamily: 'inherit',
                  }}
                />

                <div style={{ ...labelStyle(), marginTop: 17 }}>Mensagem</div>
                <textarea
                  ref={bodyRef}
                  value={body}
                  rows={8}
                  onChange={(e) => setBody(e.target.value)}
                  style={{
                    width: '100%',
                    border: `1px solid ${overLimit ? RED : LINE}`,
                    borderRadius: 11,
                    padding: '13px 14px',
                    fontSize: 16,
                    lineHeight: 1.6,
                    resize: 'vertical',
                    outline: 'none',
                    background: '#fff',
                    fontFamily: 'inherit',
                  }}
                />
                <div
                  style={{
                    fontSize: 11,
                    color: counterColor,
                    textAlign: 'right',
                    marginTop: 6,
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: overLimit ? 700 : 400,
                  }}
                >
                  {body.length} / {TEMPLATE_BODY_MAX}
                </div>

                <div style={{ ...labelStyle(), marginTop: 13 }}>Toque pra inserir</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {TEMPLATE_TOKENS.map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => insertToken(token)}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '7px 11px',
                        minHeight: 32,
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: 'rgba(220,38,38,0.10)',
                        color: RED,
                        border: '1px solid rgba(220,38,38,0.20)',
                        fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace',
                      }}
                    >
                      {token}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: INK_3, marginTop: 9, lineHeight: 1.5 }}>
                  Se voce esquecer o {'{link}'}, ele entra automaticamente no fim da mensagem.
                </div>
              </div>

              {/* -------- previa -------- */}
              <div>
                <div style={labelStyle()}>Como chega no celular do cliente</div>
                <div
                  style={{
                    background: '#e5ddd5',
                    borderRadius: 14,
                    padding: '16px 14px',
                    backgroundImage: 'radial-gradient(rgba(0,0,0,0.035) 1px, transparent 1px)',
                    backgroundSize: '14px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#1ebe5a',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      JS
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{PREVIEW_CLIENT}</div>
                      <div style={{ fontSize: 10, color: INK_3 }}>online</div>
                    </div>
                  </div>

                  <div
                    className="msgtpl-wa-bubble"
                    style={{
                      background: '#dcf8c6',
                      borderRadius: '9px 2px 9px 9px',
                      padding: '9px 11px 6px',
                      maxWidth: '90%',
                      marginLeft: 'auto',
                      fontSize: 14,
                      lineHeight: 1.5,
                      boxShadow: '0 1px 1px rgba(0,0,0,0.09)',
                    }}
                  >
                    {preview}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.4)', textAlign: 'right', marginTop: 3 }}>
                    09:41
                  </div>
                </div>
                <div style={{ fontSize: 11, color: INK_3, marginTop: 9, lineHeight: 1.5 }}>
                  Previa com dados de exemplo. Cada cliente recebe com o nome dele.
                </div>
              </div>
            </div>

            {/* -------- acoes: FORA do grid, sempre depois da previa no mobile -------- */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
                marginTop: 20,
              }}
            >
              <button
                type="button"
                onClick={save}
                disabled={!canSave}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '11px 20px',
                  minHeight: 44,
                  borderRadius: 11,
                  border: 'none',
                  cursor: canSave ? 'pointer' : 'not-allowed',
                  background: RED,
                  color: '#fff',
                  opacity: canSave ? 1 : 0.45,
                }}
              >
                {saving ? 'Salvando...' : selectedId ? 'Salvar' : 'Adicionar mensagem'}
              </button>

              <button
                type="button"
                onClick={testOnWhatsapp}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '11px 18px',
                  minHeight: 44,
                  borderRadius: 11,
                  cursor: 'pointer',
                  background: '#fff',
                  color: '#0f0f14',
                  border: `1px solid ${LINE}`,
                }}
              >
                <Send size={15} strokeWidth={2} />
                Testar no WhatsApp
              </button>

              {selectedId && (
                <>
                  <button
                    type="button"
                    onClick={makeDefault}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '11px 18px',
                      minHeight: 44,
                      borderRadius: 11,
                      cursor: 'pointer',
                      background: '#fff',
                      color: '#0f0f14',
                      border: `1px solid ${LINE}`,
                    }}
                  >
                    <Star size={15} strokeWidth={2} />
                    Definir como padrao
                  </button>

                  <button
                    type="button"
                    onClick={removeTemplate}
                    aria-label="Excluir mensagem"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 44,
                      height: 44,
                      borderRadius: 11,
                      cursor: 'pointer',
                      background: '#fff',
                      color: RED,
                      border: `1px solid ${LINE}`,
                    }}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </>
              )}

              {saved && (
                <span style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>Salvo</span>
              )}
              {error && (
                <span style={{ fontSize: 12, color: RED, fontWeight: 600 }}>{error}</span>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
