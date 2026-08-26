// src/features/booking/hooks/useConfirmMessageSettings.ts
// @eligi:confirmsg-hook
//
// Configuracao da mensagem de confirmacao: tipos, defaults e carregamento.
//
// O cache e uma PROMISE de modulo, nao um objeto: varios paineis abrindo ao
// mesmo tempo compartilham a mesma request em voo em vez de disparar N.
// Falha limpa o cache, senao um erro de rede transitorio ficaria colado ate
// o reload da pagina.
//
// Os defaults duplicam os @default do schema de proposito — sao dois
// consumidores (o banco e esta tela) e precisam concordar.

import { useEffect, useState } from 'react'
import api from '@/shared/lib/apiClient'
import { publicBookingLabel } from '@/shared/constants/publicUrl'
import type { ConfirmMessageBlocks } from '@/shared/utils/whatsapp'

export type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM'

export const PIX_TYPE_LABEL: Record<PixKeyType, string> = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  EMAIL: 'E-mail',
  PHONE: 'Telefone',
  RANDOM: 'Chave aleatória',
}

export interface BookingMessageSettings {
  showPrice: boolean
  showAddress: boolean
  showPix: boolean
  showRescheduleLink: boolean
  showPolicy: boolean
  showNote: boolean
  showSignature: boolean
  pixKey: string | null
  pixKeyType: PixKeyType | null
  pixHolder: string | null
  policyText: string | null
  noteText: string | null
  pixUpdatedAt: string | null
  updatedAt: string | null
}

export interface ConfirmMessageBusiness {
  slug: string
  name: string
  address: string
  city: string
  state: string
}

export interface ConfirmMessagePayload {
  settings: BookingMessageSettings
  business: ConfirmMessageBusiness
}

export const DEFAULT_CONFIRM_SETTINGS: BookingMessageSettings = {
  showPrice: false,
  showAddress: true,
  showPix: false,
  showRescheduleLink: true,
  showPolicy: false,
  showNote: false,
  showSignature: true,
  pixKey: null,
  pixKeyType: null,
  pixHolder: null,
  policyText: null,
  noteText: null,
  pixUpdatedAt: null,
  updatedAt: null,
}

/**
 * Monta a linha de endereco e a URL do mapa.
 *
 * `address` e texto livre no cadastro, entao a URL do Maps e uma BUSCA e nao
 * uma coordenada: o Maps tolera endereco sujo, um link estruturado nao.
 */
export function buildAddressLine(
  b: ConfirmMessageBusiness,
): { line: string; mapsUrl: string } | null {
  const street = b.address.trim()
  const local = [b.city.trim(), b.state.trim()].filter(Boolean).join('/')
  const line = [street, local].filter(Boolean).join(' — ')
  if (!line) return null
  const query = [street, b.city.trim(), b.state.trim()].filter(Boolean).join(', ')
  return { line, mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(query)}` }
}

/**
 * Traduz a configuracao salva nos blocos que o compositor entende.
 *
 * Fonte unica: a tela de configuracao e o painel da agenda chamam ESTA funcao.
 * Um bloco ligado sem o conteudo dele (PIX sem chave, politica sem texto)
 * simplesmente nao entra — o back ja rejeita isso com 422, aqui e a rede de
 * seguranca para dados antigos.
 */
export function blocksFromSettings(
  s: BookingMessageSettings,
  b: ConfirmMessageBusiness,
  ctx: { price: string | null },
): ConfirmMessageBlocks {
  const addr = buildAddressLine(b)
  const pixReady = Boolean(s.pixKey && s.pixKeyType && s.pixHolder)

  return {
    price: s.showPrice ? ctx.price : null,
    address: s.showAddress && addr ? addr.line : null,
    mapsUrl: s.showAddress && addr ? addr.mapsUrl : null,
    pix:
      s.showPix && pixReady
        ? {
            type: PIX_TYPE_LABEL[s.pixKeyType as PixKeyType],
            key: s.pixKey as string,
            holder: s.pixHolder as string,
          }
        : null,
    rescheduleLabel: s.showRescheduleLink && b.slug ? publicBookingLabel(b.slug) : null,
    policy: s.showPolicy ? s.policyText : null,
    note: s.showNote ? s.noteText : null,
    signature: s.showSignature && b.name ? b.name : null,
  }
}

let cache: Promise<ConfirmMessagePayload> | null = null

/** Carrega uma vez por sessao. Chamadas simultaneas dividem a mesma promise. */
export function loadConfirmMessageSettings(): Promise<ConfirmMessagePayload> {
  if (!cache) {
    cache = api
      .get<ConfirmMessagePayload>('/booking-message-settings')
      .then(res => res.data)
      .catch((err: unknown) => {
        cache = null
        throw err
      })
  }
  return cache
}

/** Chamado pela tela de configuracao depois de salvar. */
export function invalidateConfirmMessageSettings(): void {
  cache = null
}

/**
 * Devolve a configuracao ou null enquanto carrega.
 *
 * Null nao e erro: o consumidor monta a mensagem so com os blocos fixos, que
 * e exatamente o comportamento anterior a esta feature. Falha de rede nunca
 * deixa o botao de WhatsApp sem funcionar.
 */
export function useConfirmMessageSettings(): ConfirmMessagePayload | null {
  const [data, setData] = useState<ConfirmMessagePayload | null>(null)

  useEffect(() => {
    let alive = true
    async function run() {
      try {
        const payload = await loadConfirmMessageSettings()
        if (alive) setData(payload)
      } catch {
        // silencioso de proposito: ver docstring
      }
    }
    void run()
    return () => {
      alive = false
    }
  }, [])

  return data
}
