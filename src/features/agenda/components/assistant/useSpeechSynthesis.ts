'use client'
// src/features/agenda/components/assistant/useSpeechSynthesis.ts
// Fala a resposta com a voz do proprio sistema. Custo zero.
//
// O SpeechSynthesis nao expoe o audio, entao nao ha AnalyserNode possivel.
// O envelope do orbe vem do evento `onboundary`, que dispara a cada palavra:
// sinal real da fala, nao um pulso inventado.

import { useCallback, useEffect, useRef } from 'react'
import { isSpeechSynthesisAvailable } from './speech.types'

interface Options {
  /** Nivel 0..1 para o orbe pulsar junto com a fala. */
  onLevel: (level: number) => void
  onEnd: () => void
}

interface SpeechController {
  supported: boolean
  speak: (text: string) => boolean
  cancel: () => void
}

/** Voz pt-BR do sistema, quando houver. */
function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null
  return (
    voices.find(v => v.lang === 'pt-BR' && v.localService)
    ?? voices.find(v => v.lang === 'pt-BR')
    ?? voices.find(v => v.lang.startsWith('pt'))
    ?? null
  )
}

export function useSpeechSynthesis({ onLevel, onEnd }: Options): SpeechController {
  const decayRef = useRef<number | null>(null)
  const levelRef = useRef(onLevel)
  const endRef = useRef(onEnd)
  useEffect(() => { levelRef.current = onLevel }, [onLevel])
  useEffect(() => { endRef.current = onEnd }, [onEnd])

  const supported = isSpeechSynthesisAvailable()

  const stopDecay = useCallback(() => {
    if (decayRef.current !== null) {
      cancelAnimationFrame(decayRef.current)
      decayRef.current = null
    }
  }, [])

  const cancel = useCallback(() => {
    stopDecay()
    if (isSpeechSynthesisAvailable()) window.speechSynthesis.cancel()
    levelRef.current(0)
  }, [stopDecay])

  const speak = useCallback((text: string): boolean => {
    if (!isSpeechSynthesisAvailable() || text.trim().length === 0) return false
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = 1.02
    utterance.pitch = 1
    const voice = pickVoice()
    if (voice) utterance.voice = voice

    // Envelope: cada palavra da um ataque, e o nivel decai ate a proxima.
    let level = 0
    const decay = () => {
      decayRef.current = requestAnimationFrame(decay)
      level = Math.max(0, level - 0.045)
      levelRef.current(level)
    }

    utterance.onboundary = () => { level = 1 }
    utterance.onstart = () => { stopDecay(); level = 0.8; decayRef.current = requestAnimationFrame(decay) }
    utterance.onend = () => { stopDecay(); levelRef.current(0); endRef.current() }
    utterance.onerror = () => { stopDecay(); levelRef.current(0); endRef.current() }

    window.speechSynthesis.speak(utterance)
    return true
  }, [stopDecay])

  useEffect(() => cancel, [cancel])

  return { supported, speak, cancel }
}
