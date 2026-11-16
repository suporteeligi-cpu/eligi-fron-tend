// src/features/help/help.chat.ts
// @eligi:help-chat
//
// Conversa da ajuda como maquina de estados pura. O componente so mostra:
// - `msgs`: o que ja apareceu na tela;
// - `queue`: o que a Gi ainda vai "digitar" (sai uma por vez, com os tres pontinhos);
// - `options`: as respostas que a pessoa pode tocar (aparecem quando a fila acaba).
//
// Falar com uma pessoa so aparece depois de HUMAN_AFTER_CLICKS toques sem
// resolver (decisao do Eli, 16/11/2026). Depois de oferecido, o atalho fica no
// rodape ate recomecar.

import type { HelpGuide, HelpTopic } from './helpContent'
import { HUMAN_AFTER_CLICKS } from './help.rules'

export type ChatAction =
  | { t: 'yes-topic'; topicId: string }
  | { t: 'other-topic' }
  | { t: 'topic'; topicId: string }
  | { t: 'guide'; topicId: string; guideId: string }
  | { t: 'solved' }
  | { t: 'not-solved' }
  | { t: 'more' }
  | { t: 'human' }
  | { t: 'no-human' }

export interface ChatOption { id: string; label: string; action: ChatAction }

export type ChatMsg =
  | { id: number; from: 'bot' | 'me'; kind: 'text'; text: string }
  | { id: number; from: 'bot'; kind: 'guide'; topicId: string; guideId: string }
  | { id: number; from: 'bot'; kind: 'human' }

export interface ChatState {
  started: boolean
  msgs: ChatMsg[]
  queue: ChatMsg[]
  options: ChatOption[]
  /** Respostas que aparecem quando a fila terminar. */
  pendingOptions: ChatOption[]
  clicks: number
  humanOffered: boolean
  topicId: string | null
  guideId: string | null
  triedGuide: boolean
  nextId: number
}

export interface ChatCtx {
  topics: HelpTopic[]
  firstName: string
  /** Assunto da tela atual (pode nao existir). */
  pathTopicId: string | null
  screen: string
}

export const initialChat: ChatState = {
  started: false, msgs: [], queue: [], options: [], pendingOptions: [],
  clicks: 0, humanOffered: false, topicId: null, guideId: null, triedGuide: false, nextId: 1,
}

export type ChatEvent =
  | { t: 'start'; ctx: ChatCtx }
  | { t: 'pick'; option: ChatOption; ctx: ChatCtx }
  | { t: 'tick' }
  | { t: 'restart'; ctx: ChatCtx }

function findTopic(ctx: ChatCtx, id: string | null): HelpTopic | null {
  return ctx.topics.find((t) => t.id === id) ?? null
}

export function findGuide(ctx: { topics: HelpTopic[] }, topicId: string, guideId: string): { topic: HelpTopic; guide: HelpGuide } | null {
  const topic = ctx.topics.find((t) => t.id === topicId)
  const guide = topic?.guides.find((g) => g.id === guideId)
  return topic && guide ? { topic, guide } : null
}

function topicOptions(ctx: ChatCtx): ChatOption[] {
  return ctx.topics.map((t) => ({ id: `topic:${t.id}`, label: t.ask, action: { t: 'topic', topicId: t.id } }))
}

function guideOptions(topic: HelpTopic, skip: string | null): ChatOption[] {
  const list: ChatOption[] = topic.guides
    .filter((g) => g.id !== skip)
    .map((g) => ({ id: `guide:${topic.id}:${g.id}`, label: g.ask, action: { t: 'guide', topicId: topic.id, guideId: g.id } }))
  list.push({ id: 'other-topic', label: 'É outra coisa', action: { t: 'other-topic' } })
  return list
}

type NoId<T> = T extends unknown ? Omit<T, 'id'> : never
type NewMsg = NoId<ChatMsg>

interface Reply { bot: NewMsg[]; options: ChatOption[]; patch?: Partial<ChatState> }

function txt(text: string): NewMsg { return { from: 'bot', kind: 'text', text } }

function greeting(ctx: ChatCtx): Reply {
  const hi = ctx.firstName ? `Oi, ${ctx.firstName}! Eu sou a Gi, a assistente do Eligi.` : 'Oi! Eu sou a Gi, a assistente do Eligi.'
  const topic = findTopic(ctx, ctx.pathTopicId)
  if (topic) {
    return {
      bot: [txt(hi), txt(`Vi que você está em ${ctx.screen}. A sua dúvida é sobre ${topic.title.toLowerCase()}?`)],
      options: [
        { id: 'yes-topic', label: `Sim, é sobre ${topic.title.toLowerCase()}`, action: { t: 'yes-topic', topicId: topic.id } },
        { id: 'other-topic', label: 'Não, é sobre outra coisa', action: { t: 'other-topic' } },
      ],
    }
  }
  return { bot: [txt(hi), txt('Sobre o que é a sua dúvida?')], options: topicOptions(ctx) }
}

function replyTo(state: ChatState, a: ChatAction, ctx: ChatCtx): Reply {
  switch (a.t) {
    case 'yes-topic':
    case 'topic': {
      const topic = findTopic(ctx, a.topicId)
      if (!topic) return { bot: [txt('Sobre o que é a sua dúvida?')], options: topicOptions(ctx) }
      return { bot: [txt('Beleza! O que você quer fazer?')], options: guideOptions(topic, null), patch: { topicId: topic.id, guideId: null } }
    }
    case 'other-topic':
      return { bot: [txt('Sem problema. Sobre o que é?')], options: topicOptions(ctx) }
    case 'guide': {
      const found = findGuide(ctx, a.topicId, a.guideId)
      if (!found) return { bot: [txt('Sobre o que é a sua dúvida?')], options: topicOptions(ctx) }
      return {
        bot: [txt('É rapidinho. Faz assim:'), { from: 'bot', kind: 'guide', topicId: a.topicId, guideId: a.guideId }, txt('Deu certo?')],
        options: [
          { id: 'solved', label: 'Deu certo, valeu!', action: { t: 'solved' } },
          { id: 'not-solved', label: 'Ainda preciso de ajuda', action: { t: 'not-solved' } },
        ],
        patch: { topicId: a.topicId, guideId: a.guideId },
      }
    }
    case 'solved':
      return {
        bot: [txt('Que bom que deu certo! Se precisar de mais alguma coisa, é só me chamar.')],
        options: [{ id: 'more', label: 'Tenho outra dúvida', action: { t: 'more' } }],
        patch: { triedGuide: false },
      }
    case 'not-solved': {
      const topic = findTopic(ctx, state.topicId)
      if (!topic) return { bot: [txt('Vamos tentar de outro jeito. Sobre o que é?')], options: topicOptions(ctx), patch: { triedGuide: true } }
      const rest = guideOptions(topic, state.guideId)
      return {
        bot: [txt('Poxa. Vamos tentar de outro jeito: é alguma destas?')],
        options: rest,
        patch: { triedGuide: true },
      }
    }
    case 'more':
      return { bot: [txt('Claro! Sobre o que é?')], options: topicOptions(ctx) }
    case 'human':
      return {
        bot: [txt('Combinado! Montei a mensagem com o que você escolheu. Se quiser, conte mais um pouco e toque no botão.'), { from: 'bot', kind: 'human' }],
        options: [],
      }
    case 'no-human':
      return { bot: [txt('Tudo bem! Sobre o que mais posso te ajudar?')], options: topicOptions(ctx) }
  }
}

const NO_OFFER: ChatAction['t'][] = ['solved', 'human', 'no-human']

function enqueue(state: ChatState, bot: Reply['bot']): { queue: ChatMsg[]; nextId: number } {
  let id = state.nextId
  const queue = [...state.queue]
  for (const m of bot) queue.push({ ...m, id: id++ } as ChatMsg)
  return { queue, nextId: id }
}

export function chatReducer(state: ChatState, e: ChatEvent): ChatState {
  switch (e.t) {
    case 'start': {
      if (state.started) return state
      const r = greeting(e.ctx)
      const q = enqueue({ ...state, queue: [] }, r.bot)
      return { ...initialChat, started: true, queue: q.queue, nextId: q.nextId, pendingOptions: r.options, options: [] }
    }
    case 'restart': {
      const r = greeting(e.ctx)
      const fresh: ChatState = { ...initialChat, started: true, nextId: state.nextId }
      const q = enqueue(fresh, r.bot)
      return { ...fresh, queue: q.queue, nextId: q.nextId, pendingOptions: r.options }
    }
    case 'pick': {
      if (state.queue.length > 0) return state // ainda digitando: ignora toque perdido
      const me: ChatMsg = { id: state.nextId, from: 'me', kind: 'text', text: e.option.label }
      const clicks = state.clicks + 1
      const r = replyTo(state, e.option.action, e.ctx)
      let bot = r.bot
      let options = r.options
      let humanOffered = state.humanOffered
      if (!humanOffered && clicks >= HUMAN_AFTER_CLICKS && !NO_OFFER.includes(e.option.action.t)) {
        bot = [...bot, txt('Parece que você não achou o que queria, né? Quer falar com o nosso suporte humano?')]
        options = [
          { id: 'human', label: 'Sim, quero falar com uma pessoa', action: { t: 'human' } },
          { id: 'no-human', label: 'Não, vou continuar por aqui', action: { t: 'no-human' } },
        ]
        humanOffered = true
      }
      if (e.option.action.t === 'human') humanOffered = true
      const base: ChatState = { ...state, ...r.patch, msgs: [...state.msgs, me], nextId: state.nextId + 1, clicks, humanOffered, options: [] }
      const q = enqueue(base, bot)
      return { ...base, queue: q.queue, nextId: q.nextId, pendingOptions: options }
    }
    case 'tick': {
      if (!state.queue.length) return state
      const [head, ...rest] = state.queue
      return { ...state, msgs: [...state.msgs, head], queue: rest, options: rest.length ? [] : state.pendingOptions }
    }
  }
}

/** Tempo de "digitando" da proxima mensagem: cresce com o texto, com teto. */
export function typingDelay(msg: ChatMsg | undefined, reduced: boolean): number {
  if (!msg || reduced) return msg ? 120 : 0
  if (msg.kind === 'guide') return 900
  if (msg.kind === 'human') return 500
  return Math.min(1300, 450 + msg.text.length * 12)
}
