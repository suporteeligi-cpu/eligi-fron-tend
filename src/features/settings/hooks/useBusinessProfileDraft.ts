'use client'
// src/features/settings/hooks/useBusinessProfileDraft.ts
//
// @eligi:draft-hook-modulo
// Dono do rascunho do perfil publico (tema, imagens, perfil rico e galeria) e
// das quatro chamadas PATCH que o persistem.
//
// POR QUE EXISTE
// O editor guardava tudo em useState e salvava com um `save()` que encadeava os
// quatro PATCHes num try/finally SEM catch. Se o de imagens estourava — base64
// de logo grande e' o caso classico — o tema ja tinha sido gravado, a galeria
// nao, o spinner sumia e a tela nao dizia absolutamente nada. O lojista saia
// achando que salvou.
//
// CONTRATO
// - Cada secao salva sozinha e reporta o proprio status e erro. Uma falhar nao
//   impede as outras: e' melhor gravar o texto e avisar que a foto falhou do
//   que abortar tudo.
// - Em serie, nunca Promise.all: sao quatro escritas no MESMO registro e o
//   back resolve `getBusiness` em cada uma.
// - Depende do PATCH parcial do back (campo ausente nao e' tocado). Sem isso,
//   salvar uma secao apagaria as outras.

import { useCallback, useMemo, useState } from 'react'
import api from '@/shared/lib/apiClient'
import {
  type BusinessTheme,
  type BusinessSocials,
  sanitizeTheme,
} from '@/shared/profileTheme'

const SETTINGS_BASE = '/business-settings'

export type ProfileSection = 'theme' | 'images' | 'profile' | 'gallery'
export type SectionStatus = 'idle' | 'saving' | 'saved' | 'error'

export const PROFILE_SECTIONS: ProfileSection[] = ['theme', 'images', 'profile', 'gallery']

/** Rotulo em portugues de cada secao, para mensagens de erro na UI. */
export const SECTION_LABEL: Record<ProfileSection, string> = {
  theme: 'cores',
  images: 'logo e capa',
  profile: 'sobre, endereço e redes',
  gallery: 'fotos',
}

type StatusMap = Record<ProfileSection, SectionStatus>
type ErrorMap = Record<ProfileSection, string | null>

const IDLE_STATUS: StatusMap = {
  theme: 'idle',
  images: 'idle',
  profile: 'idle',
  gallery: 'idle',
}

const NO_ERRORS: ErrorMap = {
  theme: null,
  images: null,
  profile: null,
  gallery: null,
}

export interface BusinessProfileDraftInit {
  theme?: Partial<BusinessTheme> | null
  logo?: string | null
  cover?: string | null
  about?: string | null
  address?: string | null
  lat?: number | null
  lng?: number | null
  socials?: BusinessSocials | null
  gallery?: string[] | null
}

function messageOf(err: unknown): string {
  const e = err as { response?: { data?: { error?: string } }; message?: string }
  return e.response?.data?.error ?? e.message ?? 'Não foi possível salvar'
}

export function useBusinessProfileDraft(init: BusinessProfileDraftInit) {
  // Lazy initializer de proposito: sanitizeTheme no corpo do render violaria a
  // pureza esperada pelo React Compiler e refaria o trabalho a cada passagem.
  const [theme, setTheme] = useState<BusinessTheme>(() => sanitizeTheme(init.theme ?? undefined))
  const [logoUrl, setLogoUrl] = useState<string | null>(init.logo ?? null)
  const [coverUrl, setCoverUrl] = useState<string | null>(init.cover ?? null)
  const [about, setAbout] = useState(init.about ?? '')
  const [address, setAddress] = useState(init.address ?? '')
  const [lat, setLat] = useState<number | null>(init.lat ?? null)
  const [lng, setLng] = useState<number | null>(init.lng ?? null)
  const [socials, setSocials] = useState<BusinessSocials>(init.socials ?? {})
  const [gallery, setGallery] = useState<string[]>(init.gallery ?? [])

  const [status, setStatus] = useState<StatusMap>(IDLE_STATUS)
  const [errors, setErrors] = useState<ErrorMap>(NO_ERRORS)

  const bodyOf = useCallback(
    (section: ProfileSection): Record<string, unknown> => {
      if (section === 'theme') return { ...theme }
      if (section === 'images') return { logoUrl, coverUrl }
      if (section === 'profile') {
        return {
          about: about.trim() || null,
          address: address.trim() || null,
          lat,
          lng,
          socials,
        }
      }
      return { gallery }
    },
    [theme, logoUrl, coverUrl, about, address, lat, lng, socials, gallery],
  )

  /** Salva UMA secao. Devolve true em sucesso. Nunca lanca. */
  const saveSection = useCallback(
    async (section: ProfileSection): Promise<boolean> => {
      setStatus(s => ({ ...s, [section]: 'saving' }))
      setErrors(e => ({ ...e, [section]: null }))
      try {
        await api.patch(`${SETTINGS_BASE}/${section}`, bodyOf(section))
        setStatus(s => ({ ...s, [section]: 'saved' }))
        return true
      } catch (err: unknown) {
        setErrors(e => ({ ...e, [section]: messageOf(err) }))
        setStatus(s => ({ ...s, [section]: 'error' }))
        return false
      }
    },
    [bodyOf],
  )

  /**
   * Salva as quatro secoes em serie. NAO interrompe na primeira falha: cada
   * secao e' independente e o lojista precisa saber exatamente qual nao foi.
   */
  const saveAll = useCallback(async (): Promise<boolean> => {
    let allOk = true
    for (const section of PROFILE_SECTIONS) {
      const ok = await saveSection(section)
      if (!ok) allOk = false
    }
    return allOk
  }, [saveSection])

  const busy = useMemo(
    () => PROFILE_SECTIONS.some(s => status[s] === 'saving'),
    [status],
  )

  const failed = useMemo(
    () => PROFILE_SECTIONS.filter(s => status[s] === 'error'),
    [status],
  )

  return {
    theme, setTheme,
    logoUrl, setLogoUrl,
    coverUrl, setCoverUrl,
    about, setAbout,
    address, setAddress,
    lat, setLat,
    lng, setLng,
    socials, setSocials,
    gallery, setGallery,
    status, errors, busy, failed,
    saveSection, saveAll,
  }
}

export default useBusinessProfileDraft
