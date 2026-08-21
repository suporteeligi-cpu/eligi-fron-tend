'use client'
// src/features/agenda/components/assistant/useSpeechRecognition.ts
// Reconhecimento de fala do navegador. Custo zero.
//
// Nota de privacidade: no Chrome a Web Speech API envia o audio para os
// servidores do Google para transcrever. Nao e processamento local.

import { useCallback, useEffect, useRef } from 'react'
import {
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
  getSpeechRecognitionCtor,
} from './speech.types'
import { MicError } from './constants'

interface Options {
  /** Transcricao parcial, enquanto a pessoa ainda fala. */
  onPartial: (text: string) => void
  /** Transcricao final. Dispara uma vez por fala. */
  onFinal: (text: string) => void
  onError: (error: MicError) => void
  /** Encerrou sem nada reconhecido. */
  onEmpty: () => void
}

interface SpeechController {
  supported: boolean
  start: () => boolean
  stop: () => void
}

function classify(code: string): MicError {
  if (code === 'not-allowed' || code === 'service-not-allowed') return 'denied'
  if (code === 'audio-capture') return 'unavailable'
  return 'unavailable'
}

export function useSpeechRecognition({ onPartial, onFinal, onError, onEmpty }: Options): SpeechController {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const gotResultRef = useRef(false)
  /** Instancia anterior ainda encerrando. Iniciar por cima da InvalidStateError. */
  const closingRef = useRef(false)

  const partialRef = useRef(onPartial)
  const finalRef = useRef(onFinal)
  const errorRef = useRef(onError)
  const emptyRef = useRef(onEmpty)
  useEffect(() => { partialRef.current = onPartial }, [onPartial])
  useEffect(() => { finalRef.current = onFinal }, [onFinal])
  useEffect(() => { errorRef.current = onError }, [onError])
  useEffect(() => { emptyRef.current = onEmpty }, [onEmpty])

  const supported = getSpeechRecognitionCtor() !== null

  const stop = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    recognitionRef.current = null
    recognition.onresult = null
    recognition.onerror = null
    recognition.onspeechend = null
    // stop() encerra com gracia e ainda dispara onend. abort() deixa o servico
    // de reconhecimento do iOS num estado do qual so um reload tira.
    closingRef.current = true
    recognition.onend = () => { closingRef.current = false }
    try {
      recognition.stop()
    } catch {
      closingRef.current = false
    }
  }, [])

  const start = useCallback((): boolean => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      errorRef.current('unsupported')
      return false
    }
    if (closingRef.current) {
      // A instancia anterior ainda esta encerrando: iniciar agora lanca
      // InvalidStateError no Safari. Melhor recusar do que travar.
      return false
    }
    stop()
    gotResultRef.current = false

    const recognition = new Ctor()
    recognition.lang = 'pt-BR'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) {
          gotResultRef.current = true
          const trimmed = text.trim()
          if (trimmed.length > 0) finalRef.current(trimmed)
          return
        }
        interim += text
      }
      if (interim.trim().length > 0) partialRef.current(interim.trim())
    }

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      // "aborted" e "no-speech" sao encerramentos normais, nao falhas.
      if (event.error === 'aborted') return
      if (event.error === 'no-speech') {
        gotResultRef.current = true
        emptyRef.current()
        return
      }
      errorRef.current(classify(event.error))
    }

    recognition.onend = () => {
      closingRef.current = false
      if (!gotResultRef.current) emptyRef.current()
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      return true
    } catch {
      recognitionRef.current = null
      errorRef.current('unavailable')
      return false
    }
  }, [stop])

  useEffect(() => stop, [stop])

  return { supported, start, stop }
}
