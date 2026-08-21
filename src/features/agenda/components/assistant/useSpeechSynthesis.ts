'use client'
// src/features/agenda/components/assistant/useSpeechSynthesis.ts
// Fala a resposta com a voz do proprio sistema. Custo zero.
//
// Duas armadilhas do SpeechSynthesis, ambas tratadas aqui:
//
// 1. `getVoices()` e assincrono. Na primeira chamada quase sempre volta vazio;
//    a lista chega depois, no evento `onvoiceschanged`.
// 2. Existir a API nao significa existir voz. No Chrome sob Linux sem
//    speech-dispatcher a lista fica permanentemente vazia e `speak()` nao faz
//    nada e nao lanca erro — `onend` nunca dispara e o estado "respondendo"
//    ficaria preso para sempre. Dai o watchdog em `onstart`.
//
// O SpeechSynthesis nao expoe o audio, entao nao ha AnalyserNode possivel: o
// envelope do orbe vem de `onboundary`, que dispara a cada palavra falada.

import { useCallback, useEffect, useRef, useState } from 'react'
import { isSpeechSynthesisAvailable } from './speech.types'

/** Tempo ate considerar que a fala nunca vai comecar. */
const START_TIMEOUT_MS = 1500

interface Options {
  /** Nivel 0..1 para o orbe pulsar junto com a fala. */
  onLevel: (level: number) => void
  /** Fim da fala — por conclusao, erro ou silencio da plataforma. */
  onEnd: () => void
}

interface SpeechController {
  supported: boolean
  speak: (text: string) => boolean
  cancel: () => void
  /**
   * Destrava a sintese dentro de um gesto do usuario. O Safari exige que a
   * PRIMEIRA chamada a speak() venha de um toque; a nossa vem depois do await
   * da consulta, ou seja, fora do gesto — e o iOS bloqueia em silencio para o
   * resto da sessao. Um utterance mudo no toque resolve.
   */
  unlock: () => void
}

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null
  return (
    voices.find(v => v.lang === 'pt-BR' && v.localService)
    ?? voices.find(v => v.lang === 'pt-BR')
    ?? voices.find(v => v.lang.startsWith('pt'))
    ?? voices[0]
  )
}

export function useSpeechSynthesis({ onLevel, onEnd }: Options): SpeechController {
  const [hasVoices, setHasVoices] = useState(false)
  /** Uma falha silenciosa basta para desistir da voz nesta sessao. */
  const brokenRef = useRef(false)
  /** Ja houve um speak() dentro de um gesto do usuario. */
  const unlockedRef = useRef(false)
  const decayRef = useRef<number | null>(null)
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const levelRef = useRef(onLevel)
  const endRef = useRef(onEnd)
  useEffect(() => { levelRef.current = onLevel }, [onLevel])
  useEffect(() => { endRef.current = onEnd }, [onEnd])

  // Carga assincrona das vozes.
  useEffect(() => {
    if (!isSpeechSynthesisAvailable()) return
    const synth = window.speechSynthesis
    const check = () => {
      const available = synth.getVoices().length > 0
      setHasVoices(prev => (prev === available ? prev : available))
    }
    const id = setTimeout(check, 0)
    synth.addEventListener('voiceschanged', check)
    return () => {
      clearTimeout(id)
      synth.removeEventListener('voiceschanged', check)
    }
  }, [])

  const clearTimers = useCallback(() => {
    if (decayRef.current !== null) {
      cancelAnimationFrame(decayRef.current)
      decayRef.current = null
    }
    if (watchdogRef.current !== null) {
      clearTimeout(watchdogRef.current)
      watchdogRef.current = null
    }
  }, [])

  const cancel = useCallback(() => {
    clearTimers()
    if (isSpeechSynthesisAvailable()) window.speechSynthesis.cancel()
    levelRef.current(0)
  }, [clearTimers])

  const speak = useCallback((text: string): boolean => {
    if (brokenRef.current) return false
    if (!isSpeechSynthesisAvailable() || text.trim().length === 0) return false
    // Lista de vozes ainda nao carregada: recusa esta fala, mas NAO condena a
    // sessao. No iOS a lista costuma chegar depois da primeira interacao.
    if (window.speechSynthesis.getVoices().length === 0) return false

    clearTimers()
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = 1.02
    utterance.pitch = 1
    const voice = pickVoice()
    if (voice) utterance.voice = voice

    // Envelope: cada palavra da um ataque, o nivel decai ate a proxima.
    let level = 0
    const decay = () => {
      decayRef.current = requestAnimationFrame(decay)
      level = Math.max(0, level - 0.045)
      levelRef.current(level)
    }

    const finish = () => {
      clearTimers()
      levelRef.current(0)
      endRef.current()
    }

    utterance.onboundary = () => { level = 1 }
    utterance.onstart = () => {
      if (watchdogRef.current !== null) {
        clearTimeout(watchdogRef.current)
        watchdogRef.current = null
      }
      level = 0.8
      if (decayRef.current === null) decayRef.current = requestAnimationFrame(decay)
    }
    utterance.onend = finish
    utterance.onerror = () => { brokenRef.current = true; finish() }

    // Se a fala nunca comeca, a plataforma engoliu em silencio: desiste da voz
    // e devolve o controle, em vez de deixar o orbe preso em "respondendo".
    watchdogRef.current = setTimeout(() => {
      brokenRef.current = true
      window.speechSynthesis.cancel()
      finish()
    }, START_TIMEOUT_MS)

    window.speechSynthesis.speak(utterance)
    return true
  }, [clearTimers])

  const unlock = useCallback(() => {
    if (unlockedRef.current || brokenRef.current) return
    if (!isSpeechSynthesisAvailable()) return
    try {
      const primer = new SpeechSynthesisUtterance(' ')
      primer.volume = 0
      window.speechSynthesis.speak(primer)
      unlockedRef.current = true
    } catch {
      /* plataforma sem sintese: o texto na tela cobre */
    }
  }, [])

  useEffect(() => cancel, [cancel])

  return { supported: isSpeechSynthesisAvailable() && hasVoices, speak, cancel, unlock }
}
