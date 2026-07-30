'use client'
// src/hooks/useCardStyle.ts
// Preferência de estilo dos cards da agenda ('classic' | 'clean').
// Persistida POR DISPOSITIVO em localStorage — mesmo padrão de eligi-theme /
// eligi-sidebar-collapsed / zoom da agenda. useSyncExternalStore = leitura
// Compiler-safe, sem setState em effect e sem quebrar o memo() dos cards.

import { useSyncExternalStore } from 'react'
import type { AgendaCardStyle } from '@/features/agenda/utils/contrast'

const STORAGE_KEY  = 'eligi-card-style'
const CHANGE_EVENT = 'eligi-card-style-changed'

let cached: AgendaCardStyle = 'classic'
let hydrated = false

function readStorage(): AgendaCardStyle {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'clean' ? 'clean' : 'classic'
  } catch {
    return 'classic'
  }
}

function getSnapshot(): AgendaCardStyle {
  if (!hydrated) {
    cached = readStorage()
    hydrated = true
  }
  return cached
}

function getServerSnapshot(): AgendaCardStyle {
  return 'classic'
}

function subscribe(onStoreChange: () => void): () => void {
  const handler = () => {
    cached = readStorage()
    onStoreChange()
  }
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', handler) // outras abas do mesmo navegador
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

/** Grava a preferência e notifica todos os consumidores (mesma aba + outras). */
export function setCardStyle(style: AgendaCardStyle): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, style)
  } catch {
    /* navegação privada iOS: segue só em memória nesta sessão */
  }
  cached = style
  hydrated = true
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function useCardStyle(): AgendaCardStyle {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
