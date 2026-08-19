/* =========================================
   @eligi:raiox-flow
   Funil "Raio-X" — 7 telas + resultado, com cadastro e auto-login no fim.

   Decisoes que valem a leitura:

   - NAO usa useAuth. O hook dispara getMe() em rota nao listada como publica
     e chutaria o visitante pro /login antes da primeira pergunta.
   - NAO usa useSearchParams: exigiria <Suspense> e o valor so interessa uma
     vez, na montagem. Lemos window.location.search dentro do efeito.
   - Estado em sessionStorage: recarregar no meio do quiz (celular, aba que
     dorme, notificacao) nao pode custar as 6 respostas ja dadas.
   - Componentes auxiliares vivem no escopo do modulo com memo. Declarados
     dentro do render, remontariam a cada tecla digitada na tela 7.
========================================= */
'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Minus, Plus } from 'lucide-react'
import { PasswordChecklist } from '../components/auth/PasswordChecklist'
import { firstPasswordError } from '@/lib/passwordRules'
import {
  APPOINTMENTS,
  NO_SHOWS,
  SEGMENT_OPTIONS,
  STEPS,
  TICKET,
  TOOL_OPTIONS,
  TOTAL_QUESTIONS,
  estimatedLoss,
  estimatedRevenue,
  formatBRL,
  maskPhone,
  previewSlug,
  questionNumber,
  type CurrentTool,
  type Segment,
  type StepId,
} from './quiz.config'
import { trackFunnel, pixelStandard, type Attribution } from './tracking'
import {
  mapSignupError,
  signupExpressRequest,
  type SignupExpressError,
} from '@/lib/signupExpress.api'
import styles from './Quiz.module.css'

const STORAGE_KEY = 'eligi:raiox:answers:v1'
const ATTR_KEY = 'eligi:raiox:attribution:v1'

const LOADING_MESSAGES = [
  'Montando sua agenda…',
  'Configurando seus serviços…',
  'Gerando seu link de agendamento…',
]

/* ─────────────────────────────────────────────────────────
   ESTADO
───────────────────────────────────────────────────────── */

interface Answers {
  segment: Segment | null
  hasTeam: boolean | null
  teamSize: number
  weeklyAppointments: number
  avgTicket: number
  currentTool: CurrentTool | null
  weeklyNoShows: number
}

const INITIAL_ANSWERS: Answers = {
  segment: null,
  hasTeam: null,
  teamSize: 2,
  weeklyAppointments: APPOINTMENTS.initial,
  avgTicket: TICKET.initial,
  currentTool: null,
  weeklyNoShows: NO_SHOWS.initial,
}

interface FormState {
  name: string
  phone: string
  email: string
  password: string
  businessName: string
  businessNameTouched: boolean
  terms: boolean
  /** Honeypot — invisivel; humano nunca preenche. */
  website: string
}

const INITIAL_FORM: FormState = {
  name: '',
  phone: '',
  email: '',
  password: '',
  businessName: '',
  businessNameTouched: false,
  terms: false,
  website: '',
}

/* ─────────────────────────────────────────────────────────
   COMPONENTES AUXILIARES (escopo do modulo)
───────────────────────────────────────────────────────── */

const Headline = memo(function Headline({ text }: { text: string }) {
  const words = useMemo(() => text.split(' '), [text])
  return (
    <h1 className={styles.headline}>
      {words.map((word, i) => (
        <span
          key={word + String(i)}
          className={styles.word}
          style={{ animationDelay: String(i * 45) + 'ms' }}
        >
          {word}
        </span>
      ))}
    </h1>
  )
})

interface OptionCardProps {
  label: string
  selected: boolean
  wide?: boolean
  onSelect: () => void
  children: React.ReactNode
}

const OptionCard = memo(function OptionCard({
  label,
  selected,
  wide,
  onSelect,
  children,
}: OptionCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={[
        styles.option,
        wide ? styles.optionWide : '',
        selected ? styles.optionSelected : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.optionIcon}>{children}</span>
      <span className={styles.optionLabel}>{label}</span>
      {selected ? (
        <span className={styles.optionCheck} aria-hidden="true">
          <Check size={12} strokeWidth={3} />
        </span>
      ) : null}
    </button>
  )
})

interface SliderProps {
  min: number
  max: number
  step: number
  value: number
  label: string
  onChange: (value: number) => void
}

const Slider = memo(function Slider({
  min,
  max,
  step,
  value,
  label,
  onChange,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      className={styles.range}
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ '--pct': String(pct) + '%' } as React.CSSProperties}
    />
  )
})

const CountUp = memo(function CountUp({
  to,
  durationMs = 1300,
}: {
  to: number
  durationMs?: number
}) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    let frame = 0
    const start = performance.now()

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs)
      // easeOutCubic: chega rapido e desacelera — o numero "assenta".
      const eased = 1 - Math.pow(1 - progress, 3)
      setShown(to * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [to, durationMs])

  return <>{formatBRL(shown)}</>
})

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */

function readAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search)
  const get = (key: string) => params.get(key) || undefined
  const variant = params.get('v')

  return {
    utm_source: get('utm_source'),
    utm_medium: get('utm_medium'),
    utm_campaign: get('utm_campaign'),
    utm_content: get('utm_content'),
    utm_term: get('utm_term'),
    fbclid: get('fbclid'),
    referrer: document.referrer || undefined,
    landingVariant: variant === 'B' ? 'B' : 'A',
  }
}

function digitsOf(value: string): string {
  return value.replace(/\D/g, '')
}

/* ─────────────────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────────────────── */

export default function QuizFlow() {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [attribution, setAttribution] = useState<Attribution>({ landingVariant: 'A' })
  const [submitting, setSubmitting] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [duplicateEmail, setDuplicateEmail] = useState(false)

  const step: StepId = STEPS[index]

  /* ── Hidratacao: atribuicao + respostas salvas.
        Deferido dentro de run() para nao virar set-state-in-effect sincrono
        (o React Compiler em strict reclama do padrao direto). ── */
  useEffect(() => {
    async function run() {
      const attr = readAttribution()
      setAttribution(attr)
      try {
        window.sessionStorage.setItem(ATTR_KEY, JSON.stringify(attr))
        const saved = window.sessionStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<Answers>
          setAnswers((prev) => ({ ...prev, ...parsed }))
        }
      } catch {
        // sessionStorage bloqueado (aba privada / storage cheio):
        // o quiz roda igual, so nao sobrevive a um reload.
      }
      trackFunnel('quiz_start', attr)
    }
    void run()
  }, [])

  /* ── Persistencia das respostas ── */
  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
    } catch {
      // idem acima
    }
  }, [answers])

  /* ── Microcopy do loading ── */
  useEffect(() => {
    if (!submitting) return
    let i = 0
    const timer = window.setInterval(() => {
      i += 1
      if (i < LOADING_MESSAGES.length) setLoadingMessage(LOADING_MESSAGES[i])
    }, 1000)
    return () => window.clearInterval(timer)
  }, [submitting])

  /* ── Derivados ── */
  const revenue = estimatedRevenue(answers.weeklyAppointments, answers.avgTicket)
  const loss = estimatedLoss(answers.weeklyNoShows, answers.avgTicket)
  const selectedSegment = SEGMENT_OPTIONS.find((s) => s.value === answers.segment)


  /* ── Navegacao ── */
  const goNext = useCallback(() => {
    setIndex((prev) => {
      const next = Math.min(STEPS.length - 1, prev + 1)
      const nextStep = STEPS[next]
      trackFunnel('quiz_step', attribution, {
        step: questionNumber(nextStep),
        step_id: nextStep,
        segment: answers.segment ?? undefined,
      })
      if (nextStep === 'form') {
        pixelStandard('Lead', {
          content_name: 'raio-x',
          value: Math.round(estimatedLoss(answers.weeklyNoShows, answers.avgTicket)),
          currency: 'BRL',
        })
      }
      return next
    })
  }, [attribution, answers.segment, answers.weeklyNoShows, answers.avgTicket])

  const goBack = useCallback(() => {
    setErrors({})
    setDuplicateEmail(false)
    setIndex((prev) => Math.max(0, prev - 1))
  }, [])

  /* ── Selecao com auto-avanco.
        Auto-avancar em "Tenho equipe" esconderia o stepper de quantidade que
        acabou de aparecer — por isso a excecao. ── */
  const selectSegment = useCallback(
    (value: Segment) => {
      setAnswers((prev) => ({ ...prev, segment: value }))
      window.setTimeout(goNext, 260)
    },
    [goNext],
  )

  const selectTeam = useCallback(
    (hasTeam: boolean) => {
      setAnswers((prev) => ({
        ...prev,
        hasTeam,
        teamSize: hasTeam ? Math.max(2, prev.teamSize) : 1,
      }))
      if (!hasTeam) window.setTimeout(goNext, 260)
    },
    [goNext],
  )

  const selectTool = useCallback(
    (value: CurrentTool) => {
      setAnswers((prev) => ({ ...prev, currentTool: value }))
      window.setTimeout(goNext, 260)
    },
    [goNext],
  )

  /* ── Form ──
        O nome do estabelecimento e DERIVADO enquanto o usuario nao o edita.
        Fazer isso por efeito custaria um render extra e um set-state-in-effect
        que o React Compiler em strict marca — aqui e so leitura. ── */
  const suggestedBusinessName = useMemo(() => {
    const first = form.name.trim().split(' ')[0]
    if (!first || !selectedSegment) return ''
    return selectedSegment.namePrefix + ' do ' + first
  }, [form.name, selectedSegment])

  const businessNameValue = form.businessNameTouched
    ? form.businessName
    : suggestedBusinessName

  const canAdvance = useMemo(() => {
    if (step === 'segment') return answers.segment !== null
    if (step === 'team') return answers.hasTeam !== null
    if (step === 'tool') return answers.currentTool !== null
    if (step === 'form') {
      return (
        form.name.trim().length >= 2 &&
        digitsOf(form.phone).length >= 10 &&
        form.email.trim().length > 3 &&
        firstPasswordError(form.password) === null &&
        businessNameValue.trim().length >= 2 &&
        form.terms
      )
    }
    return true
  }, [step, answers, form, businessNameValue])

  const handleSubmit = useCallback(async () => {
    if (submitting || !canAdvance) return

    const passwordError = firstPasswordError(form.password)
    if (passwordError) {
      setErrors({ password: passwordError })
      return
    }

    setSubmitting(true)
    setLoadingMessage(LOADING_MESSAGES[0])
    setErrors({})
    setDuplicateEmail(false)

    try {
      const result = await signupExpressRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: digitsOf(form.phone),
        businessName: businessNameValue.trim(),
        segment: answers.segment as Segment,
        teamSize: answers.hasTeam ? answers.teamSize : 1,
        weeklyAppointments: answers.weeklyAppointments,
        avgTicket: answers.avgTicket,
        weeklyNoShows: answers.weeklyNoShows,
        currentTool: answers.currentTool as CurrentTool,
        termsAccepted: true,
        utm: {
          source: attribution.utm_source,
          medium: attribution.utm_medium,
          campaign: attribution.utm_campaign,
          content: attribution.utm_content,
          term: attribution.utm_term,
        },
        fbclid: attribution.fbclid,
        referrer: attribution.referrer,
        landingVariant: attribution.landingVariant === 'B' ? 'B' : 'A',
        website: form.website,
      })

      pixelStandard('CompleteRegistration', {
        content_name: 'raio-x',
        value: Math.round(result.estimatedMonthlyLoss),
        currency: 'BRL',
      })
      trackFunnel('signup_express_success', attribution, {
        segment: answers.segment ?? undefined,
        slug: result.slug,
      })

      try {
        window.sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        // sem storage, nada a limpar
      }

      // Hard nav de proposito: o middleware e o useAuth precisam enxergar os
      // cookies recem-setados. Um router.push manteria a arvore React montada
      // com o estado de "visitante".
      window.location.href = result.redirectPath
    } catch (err) {
      const signupError = err as SignupExpressError
      const message = mapSignupError(signupError)

      if (signupError.code === 'EMAIL_ALREADY_EXISTS') {
        setDuplicateEmail(true)
        setErrors({ email: message })
      } else if (signupError.field) {
        setErrors({ [signupError.field]: message })
      } else {
        setErrors({ general: message })
      }
      setSubmitting(false)
    }
  }, [submitting, canAdvance, form, businessNameValue, answers, attribution])

  const handlePrimary = useCallback(() => {
    if (step === 'form') {
      void handleSubmit()
      return
    }
    goNext()
  }, [step, handleSubmit, goNext])

  /* ── Rotulos ── */
  const primaryLabel =
    step === 'result'
      ? 'Quero recuperar esse dinheiro'
      : step === 'form'
        ? 'Abrir meu Eligi'
        : 'Continuar'

  const progressPct =
    step === 'result'
      ? (6.5 / TOTAL_QUESTIONS) * 100
      : (questionNumber(step) / TOTAL_QUESTIONS) * 100

  /* ─────────────────────────────────────────────────────── */

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <span className={styles.wordmark}>
          eligi<i>.</i>
        </span>
        {index > 0 && !submitting ? (
          <button type="button" className={styles.back} onClick={goBack}>
            <ArrowLeft size={14} /> voltar
          </button>
        ) : null}
      </header>

      <div className={styles.progress} role="progressbar" aria-valuenow={Math.round(progressPct)} aria-valuemin={0} aria-valuemax={100}>
        <span className={styles.progressBar} style={{ width: String(progressPct) + '%' }} />
      </div>

      <p className={styles.stepLabel}>
        {step === 'result' ? (
          <em>Resultado</em>
        ) : (
          <>
            <em>{String(questionNumber(step)).padStart(2, '0')}</em> / 07
          </>
        )}
      </p>

      <main className={styles.main}>
        {/* ── 1. SEGMENTO ── */}
        {step === 'segment' ? (
          <section className={styles.screen}>
            <div className={styles.left}>
              <Headline text="Qual é o seu negócio?" />
              <p className={styles.sub}>Uma pergunta por vez. Sem digitar nada até o fim.</p>
            </div>
            <div className={styles.grid}>
              {SEGMENT_OPTIONS.map((option) => {
                const Icon = option.icon
                return (
                  <OptionCard
                    key={option.value}
                    label={option.label}
                    selected={answers.segment === option.value}
                    onSelect={() => selectSegment(option.value)}
                  >
                    <Icon size={26} strokeWidth={1.6} />
                  </OptionCard>
                )
              })}
            </div>
          </section>
        ) : null}

        {/* ── 2. EQUIPE ── */}
        {step === 'team' ? (
          <section className={styles.screen}>
            <div className={styles.left}>
              <Headline text="Você atende sozinho ou tem equipe?" />
            </div>
            <div>
              <div className={styles.grid}>
                <OptionCard
                  label="Só eu"
                  wide
                  selected={answers.hasTeam === false}
                  onSelect={() => selectTeam(false)}
                >
                  <span className={styles.optionGlyph}>1</span>
                </OptionCard>
                <OptionCard
                  label="Tenho equipe"
                  wide
                  selected={answers.hasTeam === true}
                  onSelect={() => selectTeam(true)}
                >
                  <span className={styles.optionGlyph}>2+</span>
                </OptionCard>
              </div>

              <div
                className={[styles.stepper, answers.hasTeam ? styles.stepperOpen : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <button
                  type="button"
                  aria-label="Diminuir equipe"
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      teamSize: Math.max(2, prev.teamSize - 1),
                    }))
                  }
                >
                  <Minus size={22} />
                </button>
                <strong>{answers.teamSize}</strong>
                <button
                  type="button"
                  aria-label="Aumentar equipe"
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      teamSize: Math.min(50, prev.teamSize + 1),
                    }))
                  }
                >
                  <Plus size={22} />
                </button>
                <small>pessoas, contando você</small>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── 3. VOLUME ── */}
        {step === 'volume' ? (
          <section className={styles.screen}>
            <div className={styles.left}>
              <Headline text="Quantos atendimentos por semana?" />
              <p className={styles.sub}>Chute de cabeça. A gente ajusta depois.</p>
            </div>
            <div>
              <p className={styles.bigNumber}>{answers.weeklyAppointments}</p>
              <Slider
                min={APPOINTMENTS.min}
                max={APPOINTMENTS.max}
                step={APPOINTMENTS.step}
                value={answers.weeklyAppointments}
                label="Atendimentos por semana"
                onChange={(value) =>
                  setAnswers((prev) => ({ ...prev, weeklyAppointments: value }))
                }
              />
              <div className={styles.ticks}>
                <span>5</span>
                <span>100</span>
                <span>200+</span>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── 4. TICKET ── */}
        {step === 'ticket' ? (
          <section className={styles.screen}>
            <div className={styles.left}>
              <Headline text="Quanto custa um atendimento, em média?" />
            </div>
            <div>
              <p className={styles.bigNumber}>
                <small>R$</small>
                {answers.avgTicket}
              </p>
              <Slider
                min={TICKET.min}
                max={TICKET.max}
                step={TICKET.step}
                value={answers.avgTicket}
                label="Valor médio do atendimento"
                onChange={(value) => setAnswers((prev) => ({ ...prev, avgTicket: value }))}
              />
              <div className={styles.ticks}>
                <span>R$ 20</span>
                <span>R$ 250</span>
                <span>R$ 500+</span>
              </div>
              <div className={styles.live}>
                <small>Faturamento estimado / mês</small>
                <strong>{formatBRL(revenue)}</strong>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── 5. FERRAMENTA ── */}
        {step === 'tool' ? (
          <section className={styles.screen}>
            <div className={styles.left}>
              <Headline text="Como você agenda hoje?" />
            </div>
            <div className={styles.grid}>
              {TOOL_OPTIONS.map((option) => {
                const Icon = option.icon
                return (
                  <OptionCard
                    key={option.value}
                    label={option.label}
                    selected={answers.currentTool === option.value}
                    onSelect={() => selectTool(option.value)}
                  >
                    <Icon size={26} strokeWidth={1.6} />
                  </OptionCard>
                )
              })}
            </div>
          </section>
        ) : null}

        {/* ── 6. FALTAS ── */}
        {step === 'noshows' ? (
          <section className={styles.screen}>
            <div className={styles.left}>
              <Headline text="Quantas faltas ou desmarcações de última hora por semana?" />
            </div>
            <div>
              <p className={styles.bigNumber}>{answers.weeklyNoShows}</p>
              <Slider
                min={NO_SHOWS.min}
                max={NO_SHOWS.max}
                step={NO_SHOWS.step}
                value={answers.weeklyNoShows}
                label="Faltas por semana"
                onChange={(value) =>
                  setAnswers((prev) => ({ ...prev, weeklyNoShows: value }))
                }
              />
              <div className={styles.ticks}>
                <span>0</span>
                <span>15</span>
                <span>30+</span>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── RESULTADO ── */}
        {step === 'result' ? (
          <section className={styles.screen}>
            <div className={styles.left}>
              <Headline text="Você está deixando na mesa" />
            </div>
            <div>
              <p className={styles.loss}>
                <CountUp to={loss} />
                <small>por mês, só em faltas</small>
              </p>
              <p className={styles.year}>
                Em 12 meses: <strong>{formatBRL(loss * 12)}</strong>
              </p>
              {answers.currentTool === 'booksy' ? (
                <p className={styles.booksy}>
                  E ainda divide a tela com seus concorrentes.
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ── 7. CADASTRO ── */}
        {step === 'form' ? (
          <section className={styles.screen}>
            <div className={styles.left}>
              <Headline text="Seu Eligi está pronto. Só falta seu nome." />
              <p className={styles.sub}>
                Agenda, serviços e link de agendamento já montados pro seu segmento.
              </p>
            </div>

            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault()
                void handleSubmit()
              }}
              noValidate
            >
              <label className={styles.field}>
                <span>Seu nome</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="João Silva"
                  autoComplete="name"
                  disabled={submitting}
                />
              </label>

              <label className={styles.field}>
                <span>WhatsApp</span>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: maskPhone(e.target.value) }))
                  }
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                  autoComplete="tel"
                  disabled={submitting}
                />
              </label>

              <label className={styles.field}>
                <span>E-mail</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setDuplicateEmail(false)
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }}
                  placeholder="voce@email.com"
                  autoComplete="email"
                  disabled={submitting}
                />
                {errors.email ? (
                  <em className={styles.error}>
                    {errors.email}{' '}
                    {duplicateEmail ? (
                      <Link href="/login" className={styles.errorLink}>
                        Entrar
                      </Link>
                    ) : null}
                  </em>
                ) : null}
              </label>

              <label className={styles.field}>
                <span>Senha</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Crie uma senha"
                  autoComplete="new-password"
                  disabled={submitting}
                />
                {errors.password ? <em className={styles.error}>{errors.password}</em> : null}
              </label>

              <PasswordChecklist password={form.password} />

              <label className={styles.field}>
                <span>Nome do estabelecimento</span>
                <input
                  value={businessNameValue}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      businessName: e.target.value,
                      businessNameTouched: true,
                    }))
                  }
                  placeholder="Barbearia do João"
                  disabled={submitting}
                />
                <em className={styles.hint}>
                  Vira seu link: eligi.com.br/{previewSlug(businessNameValue)}
                </em>
              </label>

              {/* Honeypot — fora do fluxo de foco e invisivel pro leitor de tela. */}
              <input
                className={styles.honeypot}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={form.website}
                onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
              />

              <label className={styles.terms}>
                <input
                  type="checkbox"
                  checked={form.terms}
                  onChange={(e) => setForm((prev) => ({ ...prev, terms: e.target.checked }))}
                  disabled={submitting}
                />
                <span>
                  Li e aceito os <Link href="/termos">termos de uso</Link>, a{' '}
                  <Link href="/privacidade">política de privacidade</Link> e o{' '}
                  <Link href="/termos-plano">termo de planos</Link>.
                </span>
              </label>

              {errors.general ? <p className={styles.errorBox}>{errors.general}</p> : null}
            </form>
          </section>
        ) : null}
      </main>

      <footer className={styles.foot}>
        <button
          type="button"
          className={[styles.cta, step === 'result' ? styles.ctaRed : '']
            .filter(Boolean)
            .join(' ')}
          disabled={!canAdvance || submitting}
          onClick={handlePrimary}
        >
          {primaryLabel}
          <ArrowRight size={18} strokeWidth={2.4} />
        </button>
      </footer>

      {submitting ? (
        <div className={styles.loader} role="status" aria-live="polite">
          <p>{loadingMessage}</p>
        </div>
      ) : null}
    </div>
  )
}
