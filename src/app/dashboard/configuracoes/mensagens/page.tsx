'use client'
// src/app/dashboard/configuracoes/mensagens/page.tsx
// @eligi:confirmsg-page
// @eligi:confirmsg-a2-light
//
// Configuracao da mensagem de confirmacao de agendamento (Direcao A2).
//
// v2: a previa deixa de ser o editor.
//
// Antes a bolha era o WhatsApp em TEMA ESCURO (#0b141a de fundo, #005c4b de
// bolha) e cada bloco virava uma linha clicavel desenhada com
// rgba(255,255,255,0.05) por cima do verde escuro. Resultado: texto verde-claro
// sobre verde-escuro, blocos quase invisiveis, e o link do Google Maps ocupando
// quatro linhas empurrava os botoes para fora da tela.
//
// Agora:
//  - WhatsApp em TEMA CLARO, que e o que a maioria dos clientes ve: bolha
//    #d9fdd3 com texto #111b21 sobre #efeae2. Contraste ~14:1 contra ~4:1.
//  - a bolha e uma MENSAGEM DE VERDADE: texto corrido, link em azul, horario
//    com os dois ticks. Nada de caixinha dentro dela.
//  - os blocos saem da bolha e viram uma LISTA abaixo, com chave liga-desliga.
//    Conferir e editar deixam de disputar o mesmo espaco.
//
// Decisoes preservadas da versao anterior:
//  - sem isMobile em JS: a folha vira modal por @media
//  - a previa usa confirmMessageSegments, a MESMA funcao que monta o texto
//    enviado — nao existe formatacao paralela para divergir. O unico enfeite e
//    pintar de azul o que ja e uma URL no texto; o conteudo e identico.
//  - sem NAVBAR_OFFSET: o layout de configuracoes ja cuida do topo

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
  QrCode,
  Save,
  Send,
  Tag,
  type LucideIcon,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import {
  CONFIRM_BODY_MAX,
  bookingConfirmationMessage,
  confirmMessageSegments,
  waShareLink,
} from '@/shared/utils/whatsapp'
import {
  DEFAULT_CONFIRM_SETTINGS,
  PIX_TYPE_LABEL,
  blocksFromSettings,
  buildAddressLine,
  invalidateConfirmMessageSettings,
  type BookingMessageSettings,
  type ConfirmMessageBusiness,
  type ConfirmMessagePayload,
  type PixKeyType,
} from '@/features/booking/hooks/useConfirmMessageSettings'
import { colors, glassCard, inkLight, radius, shadows, typography } from '@/shared/theme'

// ─── Constantes ───────────────────────────────────────────────────────────────

// @eligi:confirmsg-limits2
// Tetos diferentes de proposito: politica e uma frase de regra, observacao
// costuma carregar estacionamento, referencia de local, o que trazer.
// Espelham POLICY_MAX / NOTE_MAX do controller. Divergir aqui devolve 422.
const POLICY_MAX = 140
const NOTE_MAX = 180
const PIX_KEY_MAX = 80
const PIX_HOLDER_MAX = 80

/** WhatsApp tema CLARO. O escuro era bonito e ilegivel. */
const WA_BG = '#efeae2'
const WA_BUBBLE = '#d9fdd3'
const WA_INK = '#111b21'
const WA_DIM = '#667781'
const WA_LINK = '#027eb5'

/** Chave liga-desliga no verde do WhatsApp. */
const SWITCH_ON = 'linear-gradient(135deg, #22c55e, #16a34a)'
const SWITCH_OFF = 'rgba(17,17,20,0.16)'

/** Alvo minimo de toque. */
const TAP = 44

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
  /** Falso quando o dado vem do cadastro e nao ha o que configurar. */
  configurable: boolean
}

/** Rail de cor por categoria: dinheiro verde, local azul, link roxo, aviso ambar.
 *  Mesmo vocabulario da fila de prioridades do dashboard. */
const BLOCK_META: Record<BlockKey, BlockMeta> = {
  price: {
    icon: DollarSign, label: 'Valor do serviço',
    hint: 'Preço do que foi agendado',
    rail: inkLight.ok.text, tint: inkLight.ok.bg, field: 'showPrice',
    configurable: false,
  },
  address: {
    icon: MapPin, label: 'Endereço + mapa',
    hint: 'Do cadastro do estabelecimento',
    rail: inkLight.info.text, tint: inkLight.info.bg, field: 'showAddress',
    configurable: false,
  },
  pix: {
    icon: QrCode, label: 'Pagamento por PIX',
    hint: 'Chave, tipo e nome do titular',
    rail: inkLight.ok.text, tint: inkLight.ok.bg, field: 'showPix',
    configurable: true,
  },
  reschedule: {
    icon: Calendar, label: 'Remarcar ou cancelar',
    hint: 'Link do seu agendamento online',
    rail: '#7c3aed', tint: 'rgba(124,58,237,0.10)', field: 'showRescheduleLink',
    configurable: false,
  },
  policy: {
    icon: Clock, label: 'Política de cancelamento',
    hint: `Texto livre, até ${POLICY_MAX} caracteres`,
    rail: inkLight.warn.text, tint: inkLight.warn.bg, field: 'showPolicy',
    configurable: true,
  },
  note: {
    icon: FileText, label: 'Observação livre',
    hint: `Estacionamento, o que trazer… (até ${NOTE_MAX})`,
    rail: inkLight.neutral.text, tint: inkLight.neutral.bg, field: 'showNote',
    configurable: true,
  },
  signature: {
    icon: Tag, label: 'Assinatura',
    hint: 'Nome do estabelecimento no fim',
    rail: inkLight.neutral.text, tint: inkLight.neutral.bg, field: 'showSignature',
    configurable: false,
  },
}

const PIX_TYPES: readonly PixKeyType[] = ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM']

// @eligi:confirmsg-missing
/**
 * Por que um bloco LIGADO nao esta entrando na mensagem.
 *
 * blocksFromSettings descarta bloco sem conteudo (rede de seguranca correta),
 * entao a chave fica ligada e a bolha nao muda — sem explicacao nenhuma, e
 * com 422 no salvar. Esta funcao transforma esse silencio em texto.
 *
 * Espelha o superRefine do controller. Divergir aqui devolve o 422 de volta.
 */
function missingContent(
  key: BlockKey,
  s: BookingMessageSettings,
  b: ConfirmMessageBusiness,
): string | null {
  switch (key) {
    case 'pix':
      if (!s.pixKeyType) return 'Falta escolher o tipo da chave PIX'
      if (!s.pixKey?.trim()) return 'Falta informar a chave PIX'
      if (!s.pixHolder?.trim()) return 'Falta o nome do titular'
      return null
    case 'policy':
      return s.policyText?.trim() ? null : 'Falta escrever o texto'
    case 'note':
      return s.noteText?.trim() ? null : 'Falta escrever o texto'
    case 'address':
      return buildAddressLine(b) ? null : 'Cadastre o endereço em Configurações › Empresa'
    case 'reschedule':
      return b.slug ? null : 'Seu link público de agendamento ainda não existe'
    case 'signature':
      return b.name ? null : 'Cadastre o nome do estabelecimento'
    default:
      return null
  }
}

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
.cfmsg-acts { display: flex; flex-direction: column; gap: 10px; }
@media (min-width: 900px) {
  .cfmsg-sheet {
    left: 50%; right: auto; bottom: auto; top: 50%;
    width: min(560px, 92vw); border-radius: 22px; max-height: 82dvh;
    transform: translate(-50%, -50%); padding: 22px 26px 26px;
    animation: cfmsgIn 0.2s ease;
  }
  .cfmsg-grab { display: none; }
  .cfmsg-acts { flex-direction: row-reverse; }
  .cfmsg-acts > button { flex: 1 1 0; }
}
.cfmsg-pre { white-space: pre-wrap; word-break: break-word; }
.cfmsg-row { transition: background 0.14s ease; }
@media (hover: hover) { .cfmsg-row:hover { background: rgba(0,0,0,0.02); } }
@media (prefers-reduced-motion: reduce) {
  .cfmsg-sheet { animation: none; }
  .cfmsg-row { transition: none; }
}
`

/** Pinta de azul o que ja e URL no texto. Presentacao pura: o conteudo
 *  renderizado e exatamente o mesmo que vai para o wa.me. */
function renderWithLinks(text: string) {
  return text.split(/(https?:\/\/\S+)/g).map((part, i) =>
    /^https?:\/\//.test(part)
      ? (
        <span key={i} style={{ color: WA_LINK, textDecoration: 'underline' }}>
          {part}
        </span>
      )
      : <span key={i}>{part}</span>,
  )
}

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
  const activeCount = BLOCK_ORDER.filter(k => settings[BLOCK_META[k].field]).length

  // @eligi:confirmsg-pending
  const pending = BLOCK_ORDER
    .filter(k => settings[BLOCK_META[k].field])
    .map(k => ({ key: k, missing: missingContent(k, settings, business) }))
    .filter((p): p is { key: BlockKey; missing: string } => p.missing !== null)

  const blocked = over || pending.length > 0

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 4px 48px' }}>
      <style>{CSS}</style>

      <Link
        href="/dashboard/configuracoes"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14,
          color: inkLight.label, fontSize: 13, fontWeight: 600, textDecoration: 'none',
          minHeight: TAP,
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
        Ligue e desligue os blocos abaixo para montar a sua.
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
                  ? 'Desligue um bloco para poder salvar'
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

          {/* previa: uma mensagem de verdade, nada clicavel dentro */}
          <div style={{ background: WA_BG, borderRadius: 22, padding: 14, marginBottom: 18, boxShadow: shadows.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 4px 14px', color: WA_INK }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: '50%', background: '#d3d9de', flexShrink: 0,
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
                  color: '#0f6e56', background: 'rgba(37,211,102,0.16)',
                  border: '1px solid rgba(37,211,102,0.35)', padding: '5px 9px', borderRadius: 999,
                }}
              >
                Prévia real
              </span>
            </div>

            <div
              style={{
                background: WA_BUBBLE,
                borderRadius: '14px 14px 6px 14px',
                padding: '9px 11px 6px',
                boxShadow: '0 1px 1px rgba(0,0,0,0.13)',
                maxWidth: '96%',
                marginLeft: 'auto',
              }}
            >
              <span
                className="cfmsg-pre"
                style={{ display: 'block', color: WA_INK, fontSize: 15, lineHeight: 1.5 }}
              >
                {renderWithLinks(
                  [head, ...segments.map(s => s.text)].filter(Boolean).join('\n\n'),
                )}
              </span>
              <span
                style={{
                  display: 'block', textAlign: 'right', fontSize: 11,
                  color: WA_DIM, marginTop: 3,
                }}
              >
                {sample.timeLabel} ✓✓
              </span>
            </div>
          </div>

          {/* blocos */}
          <p
            style={{
              margin: '0 0 9px 2px', fontSize: 11, fontWeight: 700, letterSpacing: '0.9px',
              textTransform: 'uppercase', color: inkLight.faint,
            }}
          >
            Blocos da mensagem · {activeCount} de {BLOCK_ORDER.length} ligados
          </p>

          <div style={{ ...glassCard, padding: 0, overflow: 'hidden', marginBottom: 18 }}>
            {/* fixo, sem chave */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderLeft: '4px solid rgba(17,17,20,0.14)' }}>
              <span style={{ flexShrink: 0, color: inkLight.faint }}><Lock size={18} /></span>
              <span style={{ flex: '1 1 0', minWidth: 0 }}>
                <b style={{ display: 'block', fontSize: 14.5, color: inkLight.strong }}>
                  Saudação, data e serviço
                </b>
                <small style={{ display: 'block', fontSize: 12, color: inkLight.faint, marginTop: 1 }}>
                  Sempre incluído — é o motivo da mensagem existir
                </small>
              </span>
            </div>

            {BLOCK_ORDER.map(key => {
              const meta = BLOCK_META[key]
              const Icon = meta.icon
              const on = Boolean(settings[meta.field])
              // @eligi:confirmsg-row-missing
              // Ligado e sem conteudo: o bloco nao entra na mensagem. O motivo
              // aparece no lugar da dica, em ambar, em vez de virar 422.
              const missing = on ? missingContent(key, settings, business) : null

              return (
                <div
                  key={key}
                  className="cfmsg-row"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 15px 11px 0',
                    borderTop: `1px solid ${colors.gray.border}`,
                    borderLeft: `4px solid ${
                      missing ? inkLight.warn.text : on ? meta.rail : 'transparent'
                    }`, // @eligi:confirmsg-row-rail
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setEditing(key)}
                    aria-label={`Abrir ${meta.label}`}
                    style={{
                      flex: '1 1 0', minWidth: 0, display: 'flex', alignItems: 'center', gap: 12,
                      background: 'transparent', border: 'none', padding: '0 0 0 11px',
                      minHeight: TAP, textAlign: 'left', cursor: 'pointer',
                      fontFamily: typography.fontFamily,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <span style={{ flexShrink: 0, color: on ? meta.rail : inkLight.faint }}>
                      <Icon size={19} />
                    </span>
                    <span style={{ flex: '1 1 0', minWidth: 0 }}>
                      <b
                        style={{
                          display: 'block', fontSize: 14.5,
                          color: on ? inkLight.strong : inkLight.faint,
                        }}
                      >
                        {meta.label}
                      </b>
                      <small
                        style={{
                          display: 'block', fontSize: 12, marginTop: 1,
                          color: missing ? inkLight.warn.text : inkLight.faint,
                          fontWeight: missing ? 600 : 400,
                        }}
                      >
                        {missing ?? meta.hint}
                      </small>
                    </span>
                  </button>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={`${on ? 'Desligar' : 'Ligar'} ${meta.label}`}
                    onClick={() => {
                      toggle(key, !on)
                      if (!on && meta.configurable) setEditing(key)
                    }}
                    style={{
                      width: TAP, height: TAP, flexShrink: 0, marginRight: 6,
                      display: 'grid', placeItems: 'center',
                      background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <span
                      style={{
                        position: 'relative', display: 'block', width: 46, height: 28,
                        borderRadius: 999, background: on ? SWITCH_ON : SWITCH_OFF,
                        transition: 'background 0.16s ease',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute', top: 3, left: on ? 21 : 3,
                          width: 22, height: 22, borderRadius: '50%', background: '#fff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                          transition: 'left 0.16s cubic-bezier(0.22,1,0.36,1)',
                        }}
                      />
                    </span>
                  </button>
                </div>
              )
            })}
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
              disabled={saving || blocked} // @eligi:confirmsg-save-gate
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                border: 'none', borderRadius: 14, padding: 15, fontSize: 16, fontWeight: 700,
                minHeight: 52, cursor: saving || blocked ? 'not-allowed' : 'pointer',
                background: blocked ? '#d9d9de' : colors.red.DEFAULT, color: '#fff',
                boxShadow: blocked ? 'none' : shadows.redMd,
                fontFamily: typography.fontFamily,
              }}
            >
              {saving ? <Loader2 size={19} className="cfmsg-spin" /> : <Save size={19} />}
              {over
                ? 'Reduza para salvar'
                : pending.length > 0
                  ? `Falta preencher: ${BLOCK_META[pending[0].key].label}`
                  : saving
                    ? 'Salvando…'
                    : 'Salvar mensagem'}
            </button>
            <button
              type="button"
              onClick={handleTest}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                border: `1px solid ${colors.gray.border}`, borderRadius: 14, padding: 15,
                fontSize: 16, fontWeight: 700, minHeight: 52, cursor: 'pointer',
                background: '#fff', color: inkLight.strong,
                fontFamily: typography.fontFamily,
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
  const isOn = Boolean(settings[meta.field])

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
              maxLength={blockKey === 'policy' ? POLICY_MAX : NOTE_MAX}
              onChange={e =>
                onPatch(blockKey === 'policy'
                  ? { policyText: e.target.value }
                  : { noteText: e.target.value })
              }
              style={{ ...inputStyle, minHeight: 96, resize: 'vertical', lineHeight: 1.5 }}
            />
            <div style={{ textAlign: 'right', fontSize: 12, color: inkLight.faint, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
              {((blockKey === 'policy' ? settings.policyText : settings.noteText) ?? '').length}/{blockKey === 'policy' ? POLICY_MAX : NOTE_MAX}
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
          {isOn && (
            <button
              type="button"
              onClick={onRemove}
              style={{
                flex: '1 1 0', border: `1px solid ${colors.gray.border}`, borderRadius: 14,
                padding: 15, fontSize: 16, fontWeight: 700, minHeight: 52, cursor: 'pointer',
                background: '#fff', color: inkLight.strong, fontFamily: typography.fontFamily,
              }}
            >
              Desligar
            </button>
          )}
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
