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

import { useCallback, useEffect, useMemo, useState } from 'react' // @eligi:gpro-react
import api from '@/shared/lib/apiClient'
import {
  type BusinessTheme,
  type BusinessSocials,
  sanitizeTheme,
} from '@/shared/profileTheme'

const SETTINGS_BASE = '/business-settings'

// @eligi:gpro-tipos
// Profissional que pode ser creditado numa foto da galeria. So id e nome: o
// seletor nao precisa de mais nada e o resto da Equipe nao atravessa a tela.
export interface GalleryPro {
  id: string
  name: string
}

export interface GalleryItemInit {
  url: string
  professionalId: string | null
}

interface EquipeRow {
  id: string
  name: string
  active?: boolean
  availableOnline?: boolean
}

function isEquipeRow(x: unknown): x is EquipeRow {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return typeof o.id === 'string' && typeof o.name === 'string'
}

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
  galleryItems?: GalleryItemInit[] | null // @eligi:gpro-init
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

  // @eligi:gpro-estado
  // Profissional de cada foto, chaveado pela URL (a lista `gallery` continua
  // sendo a fonte da ordem e do que existe). Foto removida simplesmente deixa
  // de ser consultada; nao precisa limpar o mapa.
  const [galleryPros, setGalleryPros] = useState<Record<string, string | null>>(() => {
    const m: Record<string, string | null> = {}
    for (const it of init.galleryItems ?? []) m[it.url] = it.professionalId
    return m
  })
  const [pros, setPros] = useState<GalleryPro[]>([])

  // @eligi:gpro-fetch
  // Quem pode ser creditado: ativo e com agendamento online. Oculto do link nem
  // aparece na opcao (decisao do Eli); o back confere de novo ao gravar.
  // Falhou? sem seletor — a galeria continua salvando normalmente.
  useEffect(() => {
    let alive = true
    api.get('/equipe')
      .then((res) => {
        const list: unknown = res.data?.data
        if (!alive || !Array.isArray(list)) return
        setPros(
          list
            .filter(isEquipeRow)
            .filter((p) => p.active !== false && p.availableOnline !== false)
            .map((p) => ({ id: p.id, name: p.name })),
        )
      })
      .catch((err: unknown) => {
        console.error('[perfil] lista de profissionais da galeria falhou', err)
      })
    return () => { alive = false }
  }, [])

  const setGalleryPro = useCallback((url: string, professionalId: string | null) => {
    setGalleryPros(m => ({ ...m, [url]: professionalId }))
  }, [])

  /** O upload troca o dataUrl pela URL do bucket; o credito acompanha a troca. */
  const moveGalleryPro = useCallback((from: string, to: string) => {
    setGalleryPros(m => {
      if (!(from in m)) return m
      const next = { ...m, [to]: m[from] }
      delete next[from]
      return next
    })
  }, [])

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
      // @eligi:gpro-body
      // `items` e o contrato novo; `gallery` vai junto para o back antigo
      // (que ignora `items`) nao interpretar o corpo como galeria vazia.
      return {
        gallery,
        items: gallery.map((url) => ({ url, professionalId: galleryPros[url] ?? null })),
      }
    },
    [theme, logoUrl, coverUrl, about, address, lat, lng, socials, gallery, galleryPros],
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
    galleryPros, setGalleryPro, moveGalleryPro, pros, // @eligi:gpro-retorno
    status, errors, busy, failed,
    saveSection, saveAll,
  }
}

// @eligi:draft-tipo-exportado
// O MobileProfileEditor recebe o rascunho inteiro por prop; sem um nome para a
// forma, seriam vinte props soltas atravessando a fronteira do componente.
export type BusinessProfileDraft = ReturnType<typeof useBusinessProfileDraft>

export default useBusinessProfileDraft
