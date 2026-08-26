'use client'
// src/app/dashboard/configuracoes/mensagens/page.tsx
// @eligi:confirmsg-page
//
// Configuracao da mensagem de confirmacao de agendamento (Direcao C).
//
// A previa E o editor: bloco ligado vira linha real da mensagem e abre a folha
// ao toque; bloco desligado aparece tracejado abaixo do balao.
//
// Decisoes:
//  - sem isMobile em JS: a folha vira modal por @media, como a tela anterior
//  - sem Google Fonts: o projeto nao carrega Space Grotesk; a tipografia grande
//    sai do stack do sistema (typography.fontFamily)
//  - sem toast: nao existe helper no repo, feedback e inline
//  - sem NAVBAR_OFFSET: o layout de configuracoes ja cuida do topo
//  - a previa usa confirmMessageSegments, a MESMA funcao que monta o texto
//    enviado — nao existe formatacao paralela para divergir

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Plus,
  QrCode,
  Save,
  Send,
  Tag,
  X,
  type LucideIcon,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import {
  CONFIRM_BODY_MAX,
  bookingConfirmationMessage,
  confirmMessageSegments,
  waShareLink,
  type ConfirmBlockKey,
} from '@/shared/utils/whatsapp'
import {
  DEFAULT_CONFIRM_SETTINGS,
  PIX_TYPE_LABEL,
  blocksFromSettings,
  invalidateConfirmMessageSettings,
  type BookingMessageSettings,
  type ConfirmMessageBusiness,
  type ConfirmMessagePayload,
  type PixKeyType,
} from '@/features/booking/hooks/useConfirmMessageSettings'
import { colors, glassCard, inkLight, radius, shadows, typography } from '@/shared/theme'

// ─── Constantes ───────────────────────────────────────────────────────────────

const TEXT_MAX = 140
const PIX_KEY_MAX = 80
const PIX_HOLDER_MAX = 80

const WA_BG = '#0b141a'
const WA_BUBBLE = '#005c4b'
const WA_INK = '#e9edef'
const WA_DIM = '#8696a0'

type BlockKey = 'price' | 'address' | 'pix' | 'reschedule' | 'policy' | 'note' | 'signature'

const BLOCK_ORDER: readonly BlockKey[] = [
  'price', 'address', 'pix', 'reschedule', 'policy', 'note', 'signature',
]

interface BlockMeta {
  icon: LucideIcon
  label: string
  hint: string
  rail: string
  tint: string
  field: keyof BookingMessageSettings
}

/** Rail de cor por categoria: dinheiro verde, local azul, link roxo, aviso ambar.
 *  Mesmo vocabulario da fila de prioridades do dashboard. */
const BLOCK_META: Record<BlockKey, BlockMeta> = {
  price: {
    icon: DollarSign, label: 'Valor do serviço',
    hint: 'Preço do que foi agendado',
    rail: inkLight.ok.text, tint: inkLight.ok.bg, field: 'showPrice',
  },
  address: {
    icon: MapPin, label: 'Endereço + mapa',
    hint: 'Do cadastro do estabelecimento',
    rail: inkLight.info.text, tint: inkLight.info.bg, field: 'showAddress',
  },
  pix: {
    icon: QrCode, label: 'Pagamento por PIX',
    hint: 'Chave, tipo e nome do titular',
    rail: inkLight.ok.text, tint: inkLight.ok.bg, field: 'showPix',
  },
  reschedule: {
    icon: Calendar, label: 'Remarcar ou cancelar',
    hint: 'Link do seu agendamento online',
    rail: '#7c3aed', tint: 'rgba(124,58,237,0.10)', field: 'showRescheduleLink',
  },
  policy: {
    icon: Clock, label: 'Política de cancelamento',
    hint: `Texto livre, até ${TEXT_MAX} caracteres`,
    rail: inkLight.warn.text, tint: inkLight.warn.bg, field: 'showPolicy',
  },
  note: {
    icon: FileText, label: 'Observação livre',
    hint: 'Estacionamento, o que trazer…',
    rail: inkLight.neutral.text, tint: inkLight.neutral.bg, field: 'showNote',
  },
  signature: {
    icon: Tag, label: 'Assinatura',
    hint: 'Nome do estabelecimento no fim',
    rail: inkLight.neutral.text, tint: inkLight.neutral.bg, field: 'showSignature',
  },
}

/** Chave do segmento devolvido pelo compositor -> bloco editavel da tela.
 *  'closing' nao aparece aqui: e fixo, nao configuravel. */
const SEGMENT_TO_BLOCK: Partial<Record<ConfirmBlockKey, BlockKey>> = {
  price: 'price',
  address: 'address',
  pix: 'pix',
  reschedule: 'reschedule',
  policy: 'policy',
  note: 'note',
  signature: 'signature',
}

const PIX_TYPES: readonly PixKeyType[] = ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM']

const CSS = `
.cfmsg-sheet {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 1101;
  background: #fff; border-radius: 26px 26px 0 0;
  box-shadow: 0 -16px 50px rgba(0,0,0,0.30);
  padding: 8px 20px calc(22px + env(safe-area-inset-bottom));
  max-height: 86dvh; overflow: auto; overscroll-behavior: contain;
  animation: cfmsgUp 0.26s cubic-bezier(0.32,0.72,0,1);
}
@keyframes cfmsgUp { from { transform: translateY(102%) } to { transform: translateY(0) } }
@keyframes cfmsgIn { from { opacity: 0; transform: scale(0.97) } to { opacity: 1; transform: scale(1) } }
@keyframes cfmsgSpin { to { transform: rotate(360deg) } }
.cfmsg-spin { animation: cfmsgSpin 0.9s linear infinite; }
.cfmsg-grab { width: 40px; height: 5px; border-radius: 999px; background: #dcdce2; margin: 8px auto 16px; }
.cfmsg-slots { display: grid; grid-template-columns: 1fr; gap: 8px; }
.cfmsg-acts { display: flex; flex-direction: column; gap: 10px; }
@media (min-width: 900px) {
  .cfmsg-sheet {
    left: 50%; right: auto; bottom: auto; top: 50%;
    width: min(560px, 92vw); border-radius: 22px; max-height: 82dvh;
    transform: translate(-50%, -50%); padding: 22px 26px 26px;
    animation: cfmsgIn 0.2s ease;
  }
  .cfmsg-grab { display: none; }
  .cfmsg-slots { grid-template-columns: 1fr 1fr; }
  .cfmsg-acts { flex-direction: row-reverse; }
  .cfmsg-acts > button { flex: 1 1 0; }
}
.cfmsg-pre { white-space: pre-wrap; word-break: break-word; }
`

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ConfirmMessagePage() {
  const [settings, setSettings] = useState<BookingMessageSettings>(DEFAULT_CONFIRM_SETTINGS)
  const [business, setBusiness] = useState<ConfirmMessageBusiness>({
    slug: '', name: '', address: '', city: '', state: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState<BlockKey | null>(null)

  /** Exemplo da previa. Inicializador preguicoso: ler o relogio no corpo do
   *  render viola react-hooks/purity. */
  const [sample] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    const raw = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long', day: '2-digit', month: '2-digit',
    }).format(d)
    return {
      clientName: 'Jefferson Silva',
      dateLabel: raw.charAt(0).toUpperCase() + raw.slice(1),
      timeLabel: '14:30',
      serviceLabel: 'Corte Masculino com Ana',
      price: 'R$ 45,00',
    }
  })

  useEffect(() => {
    let alive = true
    async function run() {
      try {
        const { data } = await api.get<ConfirmMessagePayload>('/booking-message-settings')
        if (!alive) return
        setSettings(data.settings)
        setBusiness(data.business)
      } catch {
        if (alive) setError('Não consegui carregar a configuração. Tente recarregar a página.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    void run()
    return () => { alive = false }
  }, [])

  const patch = useCallback((next: Partial<BookingMessageSettings>) => {
    setSettings(prev => ({ ...prev, ...next }))
    setSaved(false)
    setError(null)
  }, [])

  const toggle = useCallback((key: BlockKey, value: boolean) => {
    patch({ [BLOCK_META[key].field]: value } as Partial<BookingMessageSettings>)
  }, [patch])

  const blocks = blocksFromSettings(settings, business, { price: sample.price })
  const { head, blocks: segments } = confirmMessageSegments({ ...sample, blocks })
  const fullText = bookingConfirmationMessage({ ...sample, blocks })
  const used = fullText.length
  const over = used > CONFIRM_BODY_MAX

  const activeSegments = segments.filter(s => SEGMENT_TO_BLOCK[s.key])
  const closing = segments.find(s => s.key === 'closing')
  const offBlocks = BLOCK_ORDER.filter(k => !settings[BLOCK_META[k].field])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const { data } = await api.put<BookingMessageSettings>('/booking-message-settings', settings)
      setSettings(data)
      invalidateConfirmMessageSettings()
      setSaved(true)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Não consegui salvar. Tente de novo.')
    } finally {
      setSaving(false)
    }
  }, [settings])

  const handleTest = useCallback(() => {
    window.open(waShareLink(fullText), '_blank', 'noopener,noreferrer')
  }, [fullText])

  const meterTone = over ? inkLight.bad : used > CONFIRM_BODY_MAX * 0.8 ? inkLight.warn : inkLight.ok

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 4px 48px' }}>
      <style>{CSS}</style>

      <Link
        href="/dashboard/configuracoes"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14,
          color: inkLight.label, fontSize: 13, fontWeight: 600, textDecoration: 'none',
          minHeight: 44,
        }}
      >
        <ChevronLeft size={16} /> Configurações
      </Link>

      <h1
        style={{
          margin: '0 0 10px',
          fontFamily: typography.fontFamily,
          fontSize: 'clamp(28px, 6vw, 42px)',
          fontWeight: 700,
          letterSpacing: '-1.2px',
          lineHeight: 1.05,
          color: inkLight.strong,
        }}
      >
        Mensagem de confirmação
      </h1>
      <p style={{ margin: '0 0 20px', color: colors.gray[500], fontSize: 15, maxWidth: '52ch' }}>
        É o que o cliente recebe quando você toca no botão do WhatsApp na agenda.
        Toque em qualquer parte da mensagem para editar.
      </p>

      {loading ? (
        <div style={{ ...glassCard, padding: 40, display: 'flex', justifyContent: 'center' }}>
          <Loader2 size={22} color={colors.gray[500]} className="cfmsg-spin" />
        </div>
      ) : (
        <>
          {/* medidor */}
          <div style={{ ...glassCard, padding: '16px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flexShrink: 0 }}>
              <span
                style={{
                  fontSize: 'clamp(28px, 7vw, 38px)', fontWeight: 700, lineHeight: 1,
                  letterSpacing: '-1.4px', fontVariantNumeric: 'tabular-nums',
                  color: meterTone.text,
                }}
              >
                {used}
              </span>
              <span style={{ fontSize: 15, fontWeight: 500, color: inkLight.faint, marginLeft: 2 }}>
                /{CONFIRM_BODY_MAX}
              </span>
            </div>
            <div style={{ flex: '1 1 0', minWidth: 0 }}>
              <b style={{ display: 'block', fontSize: 14, color: inkLight.strong }}>
                {over ? 'Passou do limite' : 'Tamanho da mensagem'}
              </b>
              <small style={{ display: 'block', fontSize: 12.5, color: inkLight.faint, marginTop: 2 }}>
                {over
                  ? 'Remova um bloco para poder salvar'
                  : 'Acima de 500 o WhatsApp corta no meio'}
              </small>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(0,0,0,0.07)', overflow: 'hidden', marginTop: 9 }}>
                <div
                  style={{
                    height: '100%', borderRadius: 999, background: meterTone.text,
                    width: `${Math.min(100, Math.round((used / CONFIRM_BODY_MAX) * 100))}%`,
                    transition: 'width 0.22s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* previa editavel */}
          <div style={{ background: WA_BG, borderRadius: 22, padding: 14, marginBottom: 16, boxShadow: shadows.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 4px 14px', color: WA_INK }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: '50%', background: '#2a3942', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: WA_DIM,
                }}
              >
                <MessageCircle size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <b style={{ fontSize: 14.5, fontWeight: 700 }}>{sample.clientName}</b>
                <small style={{ display: 'block', color: WA_DIM, fontSize: 11.5 }}>exemplo de mensagem</small>
              </div>
              <span
                style={{
                  marginLeft: 'auto', flexShrink: 0, whiteSpace: 'nowrap',
                  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
                  color: '#a8f0c6', background: 'rgba(37,211,102,0.14)',
                  border: '1px solid rgba(37,211,102,0.30)', padding: '5px 9px', borderRadius: 999,
                }}
              >
                Prévia real
              </span>
            </div>

            <div style={{ background: WA_BUBBLE, borderRadius: '14px 14px 6px 14px', padding: 6 }}>
              <div style={{ padding: '9px 11px', color: WA_INK, fontSize: 15, lineHeight: 1.55 }}>
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5,
                    fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase',
                    color: '#9ed6c4', marginBottom: 7, opacity: 0.85,
                  }}
                >
                  <Lock size={11} /> Sempre incluído
                </span>
                <span className="cfmsg-pre" style={{ display: 'block' }}>{head}</span>
              </div>

              {activeSegments.map(seg => {
                const key = SEGMENT_TO_BLOCK[seg.key] as BlockKey
                const meta = BLOCK_META[key]
                const Icon = meta.icon
                return (
                  <div
                    key={seg.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => setEditing(key)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setEditing(key) }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 11, width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      borderLeft: `4px solid ${meta.rail}`,
                      borderRadius: 10, padding: '11px 12px', marginTop: 7, cursor: 'pointer',
                      color: WA_INK, fontSize: 15, lineHeight: 1.55, minHeight: 52,
                    }}
                  >
                    <Icon size={19} color={meta.rail} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span className="cfmsg-pre" style={{ flex: '1 1 0', minWidth: 0 }}>{seg.text}</span>
                    <button
                      type="button"
                      aria-label={`Remover ${meta.label}`}
                      onClick={e => { e.stopPropagation(); toggle(key, false) }}
                      style={{
                        flexShrink: 0, width: 32, height: 32, borderRadius: '50%', border: 'none',
                        background: 'rgba(255,255,255,0.09)', color: WA_DIM, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })}

              {closing && (
                <div style={{ padding: '9px 11px', color: WA_INK, fontSize: 15, lineHeight: 1.55 }}>
                  <span className="cfmsg-pre">{closing.text}</span>
                </div>
              )}
            </div>

            {offBlocks.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p
                  style={{
                    margin: '0 0 9px 2px', fontSize: 11, fontWeight: 700, letterSpacing: '0.7px',
                    textTransform: 'uppercase', color: WA_DIM,
                  }}
                >
                  Disponível para adicionar
                </p>
                <div className="cfmsg-slots">
                  {offBlocks.map(key => {
                    const meta = BLOCK_META[key]
                    const Icon = meta.icon
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          toggle(key, true)
                          if (key === 'pix' || key === 'policy' || key === 'note') setEditing(key)
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
                          background: 'transparent', border: '1.5px dashed rgba(255,255,255,0.20)',
                          borderRadius: 12, padding: 12, cursor: 'pointer', color: WA_DIM,
                          font: 'inherit', fontSize: 14.5, fontWeight: 600, minHeight: 56,
                        }}
                      >
                        <Icon size={19} color={meta.rail} style={{ flexShrink: 0 }} />
                        <span style={{ flex: '1 1 0', minWidth: 0 }}>
                          {meta.label}
                          <small style={{ display: 'block', fontWeight: 400, fontSize: 12, opacity: 0.75, marginTop: 1 }}>
                            {meta.hint}
                          </small>
                        </span>
                        <Plus size={19} style={{ flexShrink: 0, opacity: 0.7 }} />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {settings.showPrice && (
            <div
              style={{
                display: 'flex', gap: 10, background: inkLight.warn.bg,
                border: `1px solid ${inkLight.warn.border}`, color: inkLight.warn.text,
                borderRadius: radius.lg, padding: '12px 14px', fontSize: 13.5, marginBottom: 16,
              }}
            >
              <Clock size={17} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <b>Valor ligado.</b> Na hora de confirmar o horário ainda não se sabe como o cliente
                vai pagar — pacote, assinatura e clube só entram no caixa. O preço na mensagem é
                sempre provisório.
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                background: inkLight.bad.bg, border: `1px solid ${inkLight.bad.border}`,
                color: inkLight.bad.text, borderRadius: radius.lg, padding: '12px 14px',
                fontSize: 13.5, marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {saved && !error && (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: inkLight.ok.bg, border: `1px solid ${inkLight.ok.border}`,
                color: inkLight.ok.text, borderRadius: radius.lg, padding: '12px 14px',
                fontSize: 13.5, marginBottom: 16,
              }}
            >
              <Check size={16} /> Mensagem salva. Já vale para os próximos agendamentos.
            </div>
          )}

          <div className="cfmsg-acts">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || over}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                border: 'none', borderRadius: 14, padding: 15, fontSize: 16, fontWeight: 700,
                minHeight: 52, cursor: saving || over ? 'not-allowed' : 'pointer',
                background: over ? '#d9d9de' : colors.red.DEFAULT, color: '#fff',
                boxShadow: over ? 'none' : shadows.redMd,
              }}
            >
              {saving ? <Loader2 size={19} className="cfmsg-spin" /> : <Save size={19} />}
              {over ? 'Reduza para salvar' : saving ? 'Salvando…' : 'Salvar mensagem'}
            </button>
            <button
              type="button"
              onClick={handleTest}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                border: `1px solid ${colors.gray.border}`, borderRadius: 14, padding: 15,
                fontSize: 16, fontWeight: 700, minHeight: 52, cursor: 'pointer',
                background: '#fff', color: inkLight.strong,
              }}
            >
              <Send size={19} /> Testar no meu WhatsApp
            </button>
          </div>
        </>
      )}

      {editing && (
        <BlockSheet
          blockKey={editing}
          settings={settings}
          onPatch={patch}
          onRemove={() => { toggle(editing, false); setEditing(null) }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

// ─── Folha de edicao ──────────────────────────────────────────────────────────

interface BlockSheetProps {
  blockKey: BlockKey
  settings: BookingMessageSettings
  onPatch: (next: Partial<BookingMessageSettings>) => void
  onRemove: () => void
  onClose: () => void
}

function BlockSheet({ blockKey, settings, onPatch, onRemove, onClose }: BlockSheetProps) {
  const meta = BLOCK_META[blockKey]
  const Icon = meta.icon

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const inputStyle: CSSProperties = {
    width: '100%', fontSize: 16, padding: '14px 15px',
    border: `1.5px solid ${colors.gray.border}`, borderRadius: 13,
    background: '#fbfbfc', color: inkLight.strong, minHeight: 52,
    fontFamily: typography.fontFamily,
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)',
          backdropFilter: 'blur(3px)', zIndex: 1100,
        }}
      />
      <div className="cfmsg-sheet" role="dialog" aria-label={meta.label}>
        <div className="cfmsg-grab" />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginBottom: 18 }}>
          <div
            style={{
              width: 46, height: 46, borderRadius: 14, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: meta.tint, color: meta.rail,
            }}
          >
            <Icon size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.7px', color: inkLight.strong }}>
              {meta.label}
            </h2>
            <p style={{ margin: '3px 0 0', color: inkLight.faint, fontSize: 13.5 }}>{meta.hint}</p>
          </div>
        </div>

        {blockKey === 'pix' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: colors.gray[700], marginBottom: 7 }}>
                Tipo da chave
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PIX_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onPatch({ pixKeyType: t })}
                    style={{
                      border: `1.5px solid ${settings.pixKeyType === t ? inkLight.strong : colors.gray.border}`,
                      background: settings.pixKeyType === t ? inkLight.strong : '#fff',
                      color: settings.pixKeyType === t ? '#fff' : colors.gray[700],
                      padding: '12px 16px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', minHeight: 48, fontFamily: typography.fontFamily,
                    }}
                  >
                    {PIX_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: colors.gray[700], marginBottom: 7 }}>
                Chave PIX
              </label>
              <input
                value={settings.pixKey ?? ''}
                maxLength={PIX_KEY_MAX}
                onChange={e => onPatch({ pixKey: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: colors.gray[700], marginBottom: 7 }}>
                Nome do titular
              </label>
              <input
                value={settings.pixHolder ?? ''}
                maxLength={PIX_HOLDER_MAX}
                onChange={e => onPatch({ pixHolder: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div
              style={{
                display: 'flex', gap: 10, background: inkLight.info.bg,
                border: `1px solid ${inkLight.info.border}`, color: inkLight.info.text,
                borderRadius: 13, padding: '12px 14px', fontSize: 13,
              }}
            >
              <Lock size={17} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                Sem o nome do titular o cliente não sabe se está pagando para a pessoa certa.
                Toda alteração desta chave fica registrada com data e autor.
              </div>
            </div>
          </>
        )}

        {(blockKey === 'policy' || blockKey === 'note') && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: colors.gray[700], marginBottom: 7 }}>
              Texto
            </label>
            <textarea
              value={(blockKey === 'policy' ? settings.policyText : settings.noteText) ?? ''}
              maxLength={TEXT_MAX}
              onChange={e =>
                onPatch(blockKey === 'policy'
                  ? { policyText: e.target.value }
                  : { noteText: e.target.value })
              }
              style={{ ...inputStyle, minHeight: 96, resize: 'vertical', lineHeight: 1.5 }}
            />
            <div style={{ textAlign: 'right', fontSize: 12, color: inkLight.faint, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
              {((blockKey === 'policy' ? settings.policyText : settings.noteText) ?? '').length}/{TEXT_MAX}
            </div>
          </div>
        )}

        {blockKey === 'price' && (
          <div
            style={{
              display: 'flex', gap: 10, background: inkLight.warn.bg,
              border: `1px solid ${inkLight.warn.border}`, color: inkLight.warn.text,
              borderRadius: 13, padding: '12px 14px', fontSize: 13,
            }}
          >
            <Clock size={17} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              Não há o que configurar: o valor vem do próprio serviço agendado. Lembre que
              pacote, assinatura e clube só são aplicados no caixa, depois do atendimento.
            </div>
          </div>
        )}

        {(blockKey === 'address' || blockKey === 'reschedule' || blockKey === 'signature') && (
          <div
            style={{
              display: 'flex', gap: 10, background: inkLight.info.bg,
              border: `1px solid ${inkLight.info.border}`, color: inkLight.info.text,
              borderRadius: 13, padding: '12px 14px', fontSize: 13,
            }}
          >
            <Check size={17} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              Este bloco não precisa de configuração — o dado vem do cadastro do
              estabelecimento e fica sempre atualizado.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            type="button"
            onClick={onRemove}
            style={{
              flex: '1 1 0', border: `1px solid ${colors.gray.border}`, borderRadius: 14,
              padding: 15, fontSize: 16, fontWeight: 700, minHeight: 52, cursor: 'pointer',
              background: '#fff', color: inkLight.strong, fontFamily: typography.fontFamily,
            }}
          >
            Remover
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: '1 1 0', border: 'none', borderRadius: 14, padding: 15,
              fontSize: 16, fontWeight: 700, minHeight: 52, cursor: 'pointer',
              background: colors.red.DEFAULT, color: '#fff', boxShadow: shadows.redMd,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: typography.fontFamily,
            }}
          >
            <Check size={18} /> Pronto
          </button>
        </div>
      </div>
    </>
  )
}
