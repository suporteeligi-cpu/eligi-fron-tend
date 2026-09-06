'use client'
// src/features/agenda/components/LunchExceptionMenu.tsx
// @eligi:lunch-exc-menu
// Menu que abre ao tocar na faixa de almoco.
//
// A REGRA vive no perfil do profissional (aba Horarios). Aqui so se AJUSTA —
// e o ajuste acontece onde a dor aparece: as 11h50, com tres clientes
// esperando, ninguem vai em Equipe > Horarios.
//
// Por que "Pular hoje" existe: no dia cheio o barbeiro nao quer MOVER o
// almoco nem MUDAR todo dia, quer abrir mao dele so hoje. Sem essa opcao ele
// apaga a regra inteira e nunca mais recria — a feature morre na primeira
// semana movimentada.
//
// Segue o padrao visual do SlotContextMenu: bottom sheet no celular, menu
// flutuante no desktop.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, Repeat, SkipForward, RotateCcw, X, Loader2 } from 'lucide-react'
import { colors, typography, radius, shadows, transitions, glass } from '@/shared/theme'
import { useIsMobile } from '@/hooks/useIsMobile'
import api from '@/shared/lib/apiClient'
import { AgendaBlock } from '../types'
import { useAgendaStore } from '../hooks/useAgendaStore'

interface Props {
  block:   AgendaBlock
  x:       number
  y:       number
  onClose: () => void
}

type Modo = 'menu' | 'hoje' | 'todos'

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/

function rotuloData(iso: string): string {
  // Meio-dia evita que o fuso empurre a data para o dia anterior.
  const d = new Date(`${iso}T12:00:00`)
  const hoje = new Date()
  const mesmoDia =
    d.getFullYear() === hoje.getFullYear() &&
    d.getMonth() === hoje.getMonth() &&
    d.getDate() === hoje.getDate()
  const fmt = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
  return mesmoDia ? `hoje, ${fmt}` : fmt
}

export default function LunchExceptionMenu({ block, x, y, onClose }: Props) {
  const isMobile = useIsMobile()
  const setBlocksForDate = useAgendaStore(s => s.setBlocksForDate)

  const [modo,    setModo]    = useState<Modo>('menu')
  const [inicio,  setInicio]  = useState(block.startTime)
  const [fim,     setFim]     = useState(block.endTime)
  const [salvando, setSalvando] = useState(false)
  const [erro,    setErro]    = useState<string | null>(null)

  const profId = block.professionalId
  const data   = block.date
  const invalido = !HHMM.test(inicio) || !HHMM.test(fim) || inicio >= fim

  // O back nao emite socket nas rotas de excecao, entao a agenda nao se
  // atualiza sozinha. Relemos o dia e escrevemos no store.
  async function recarregar() {
    const res = await api.get('/blocks', { params: { date: data } })
    const lista = (res.data?.data ?? res.data) as AgendaBlock[]
    if (Array.isArray(lista)) setBlocksForDate(data, lista)
  }

  async function executar(fn: () => Promise<unknown>) {
    if (salvando) return
    setSalvando(true)
    setErro(null)
    try {
      await fn()
      await recarregar()
      onClose()
    } catch (e) {
      const resp = (e as { response?: { data?: { error?: string } } }).response
      setErro(resp?.data?.error ?? 'Não foi possível salvar. Tente de novo.')
      setSalvando(false)
    }
  }

  const mudarHoje = () => executar(() =>
    api.post(`/equipe/${profId}/lunch/exception`, { date: data, startTime: inicio, endTime: fim }),
  )

  const mudarTodos = () => executar(async () => {
    // O PUT da regra exige weekdays e active. Lemos antes para nao apagar os
    // dias que a pessoa configurou no perfil ao mexer so no horario.
    const atual = await api.get(`/equipe/${profId}/lunch`)
    const regra = atual.data?.data
    if (!regra) throw new Error('sem regra')
    await api.put(`/equipe/${profId}/lunch`, {
      startTime: inicio,
      endTime:   fim,
      weekdays:  regra.weekdays,
      active:    regra.active,
    })
  })

  const pularHoje = () => executar(() =>
    api.post(`/equipe/${profId}/lunch/exception`, { date: data }),
  )

  const voltarNormal = () => executar(() =>
    api.delete(`/equipe/${profId}/lunch/exception`, { params: { date: data } }),
  )

  const acoes = [
    {
      id: 'hoje',
      icon: <CalendarDays size={isMobile ? 22 : 15} color={colors.red.DEFAULT} strokeWidth={2} />,
      label: 'Mudar só neste dia',
      sub: rotuloData(data),
      onClick: () => { setModo('hoje'); setErro(null) },
      accent: true,
    },
    {
      id: 'todos',
      icon: <Repeat size={isMobile ? 22 : 15} color={colors.slate.DEFAULT} strokeWidth={2} />,
      label: 'Mudar todos os dias',
      sub: 'vira o novo horário padrão',
      onClick: () => { setModo('todos'); setErro(null) },
      accent: false,
    },
    {
      id: 'pular',
      icon: <SkipForward size={isMobile ? 22 : 15} color={colors.slate.DEFAULT} strokeWidth={2} />,
      label: 'Pular o almoço neste dia',
      sub: 'atende no horário todo',
      onClick: pularHoje,
      accent: false,
    },
    {
      id: 'normal',
      icon: <RotateCcw size={isMobile ? 22 : 15} color={colors.slate.DEFAULT} strokeWidth={2} />,
      label: 'Voltar ao horário normal',
      sub: 'desfaz a alteração deste dia',
      onClick: voltarNormal,
      accent: false,
    },
  ]

  /* ---------- editor de horario (usado por "hoje" e "todos") ---------- */
  const editor = (
    <div style={{ padding: isMobile ? '4px 20px 16px' : '12px 14px' }}>
      <p style={{
        margin: '0 0 12px', fontSize: typography.scale.sm,
        color: typography.color.muted, lineHeight: 1.45,
      }}>
        {modo === 'hoje'
          ? `O almoço muda só em ${rotuloData(data)}. Os outros dias continuam ${block.startTime}.`
          : 'O novo horário passa a valer em todos os dias marcados no perfil.'}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="time" value={inicio} aria-label="Início do almoço"
          onChange={e => setInicio(e.target.value)}
          style={inputHora}
        />
        <span style={{ fontSize: 13, color: typography.color.muted }}>até</span>
        <input
          type="time" value={fim} aria-label="Fim do almoço"
          onChange={e => setFim(e.target.value)}
          style={inputHora}
        />
      </div>

      {invalido && (
        <p style={{ margin: '10px 0 0', fontSize: 12.5, color: colors.red.DEFAULT }}>
          O almoço precisa terminar depois de começar.
        </p>
      )}
      {erro && (
        <p style={{ margin: '10px 0 0', fontSize: 12.5, color: colors.red.DEFAULT }}>{erro}</p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button
          onClick={() => { setModo('menu'); setErro(null) }}
          disabled={salvando}
          style={{ ...botao, flex: 1 }}
        >
          Voltar
        </button>
        <button
          onClick={modo === 'hoje' ? mudarHoje : mudarTodos}
          disabled={invalido || salvando}
          style={{
            ...botao, flex: 2,
            background: colors.red.DEFAULT, borderColor: colors.red.DEFAULT,
            color: '#fff', fontWeight: typography.weight.bold,
            opacity: (invalido || salvando) ? 0.55 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {salvando && <Loader2 size={14} className="lx-spin" />}
          Salvar
        </button>
      </div>
    </div>
  )

  const listaAcoes = (
    <>
      <div style={{
        padding: isMobile ? '0 16px 8px' : 0,
        display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 0,
      }}>
        {acoes.map((a, i) => (
          <button
            key={a.id}
            onClick={a.onClick}
            disabled={salvando}
            style={isMobile ? {
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 18px', borderRadius: radius.lg,
              border: `1px solid ${a.accent ? colors.red.border : colors.slate.border}`,
              background: a.accent ? colors.red.subtle : colors.slate.subtle,
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: `all ${transitions.fast}`,
              fontFamily: 'inherit', opacity: salvando ? 0.6 : 1,
            } : {
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px', border: 'none',
              borderBottom: i < acoes.length - 1 ? `1px solid ${colors.gray.border}` : 'none',
              background: 'transparent', cursor: 'pointer', textAlign: 'left',
              transition: `background ${transitions.fast}`,
              fontFamily: 'inherit', opacity: salvando ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!isMobile) e.currentTarget.style.background = a.accent ? colors.red.subtle : colors.slate.subtle }}
            onMouseLeave={e => { if (!isMobile) e.currentTarget.style.background = 'transparent' }}
          >
            {isMobile ? (
              <>
                <div style={{
                  width: 44, height: 44, borderRadius: radius.md, flexShrink: 0,
                  background: a.accent ? 'rgba(220,38,38,0.1)' : 'rgba(71,85,105,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {a.icon}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: typography.weight.bold, color: a.accent ? colors.red.dark : colors.slate.dark }}>{a.label}</div>
                  <div style={{ fontSize: typography.scale.sm, color: typography.color.muted, marginTop: 2 }}>{a.sub}</div>
                </div>
              </>
            ) : (
              <>
                {a.icon}
                <span style={{ fontSize: typography.scale.base, fontWeight: typography.weight.semibold, color: a.accent ? colors.red.dark : colors.slate.dark }}>
                  {a.label}
                </span>
              </>
            )}
          </button>
        ))}
      </div>
      {erro && (
        <p style={{
          margin: 0, padding: isMobile ? '4px 20px 12px' : '8px 14px 10px',
          fontSize: 12.5, color: colors.red.DEFAULT, lineHeight: 1.45,
        }}>
          {erro}
        </p>
      )}
    </>
  )

  const conteudo = modo === 'menu' ? listaAcoes : editor
  const spin = <style>{`@keyframes lxSpin{to{transform:rotate(360deg)}}.lx-spin{animation:lxSpin 0.8s linear infinite}`}</style>

  if (isMobile) {
    return createPortal(
      <>
        <style>{`@keyframes lxUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        {spin}
        {/* @eligi:lunchmenu-stop-mob-overlay
            stopPropagation antes do onClose: na arvore React este overlay e
            filho do LunchBand, entao sem ele o clique fecha e REABRE o menu. */}
        <div
          onClick={e => { e.stopPropagation(); onClose() }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(6px)', zIndex: 9998 }}
        />
        <div
          // @eligi:lunchmenu-stop-mob-sheet
          // Sem isto, clicar DENTRO do sheet tambem sobe ate o LunchBand e
          // reabre o menu por cima de si mesmo.
          onClick={e => e.stopPropagation()}
          style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          background: glass.surface.modal.background,
          backdropFilter: glass.surface.modal.backdropFilter,
          WebkitBackdropFilter: glass.surface.modal.backdropFilter,
          borderRadius: `${radius['2xl']}px ${radius['2xl']}px 0 0`,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
          zIndex: 9999, fontFamily: typography.fontFamily,
          animation: 'lxUp 0.28s cubic-bezier(0.34,1.2,0.64,1)',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.12)' }} />
          </div>

          <div style={{ padding: '8px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: typography.weight.bold, color: typography.color.primary }}>
                Horário de almoço
              </div>
              <div style={{ fontSize: typography.scale.sm, color: typography.color.muted, marginTop: 2 }}>
                {block.startTime}–{block.endTime} · {rotuloData(data)}
              </div>
            </div>
            <button onClick={onClose} aria-label="Fechar" style={{
              width: 30, height: 30, borderRadius: radius.full, flexShrink: 0,
              border: `1px solid ${colors.gray.borderMd}`, background: colors.background.surfaceLight,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={14} color={colors.gray.dimText} />
            </button>
          </div>

          {conteudo}
        </div>
      </>,
      document.body,
    )
  }

  const menuW = modo === 'menu' ? 250 : 280
  const menuH = modo === 'menu' ? 200 : 190
  const posX = Math.min(x, window.innerWidth - menuW - 12)
  const posY = Math.min(y, window.innerHeight - menuH - 12)

  return createPortal(
    <>
      <style>{`@keyframes lxFade{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
      {spin}
      {/* @eligi:lunchmenu-stop-desk-overlay */}
      <div
        onClick={e => { e.stopPropagation(); onClose() }}
        style={{ position: 'fixed', inset: 0, zIndex: 9997 }}
      />
      <div
        // @eligi:lunchmenu-stop-desk-menu
        onClick={e => e.stopPropagation()}
        style={{
        position: 'fixed', left: posX, top: posY, width: menuW,
        background: glass.surface.modal.background,
        backdropFilter: glass.surface.modal.backdropFilter,
        WebkitBackdropFilter: glass.surface.modal.backdropFilter,
        borderRadius: radius.lg, border: `1px solid ${colors.gray.borderMd}`,
        boxShadow: shadows.lg, zIndex: 9998, overflow: 'hidden',
        fontFamily: typography.fontFamily, animation: 'lxFade 0.12s ease',
      }}>
        <div style={{
          padding: '10px 14px 8px', borderBottom: `1px solid ${colors.gray.border}`,
        }}>
          <div style={{ fontSize: typography.scale.sm, fontWeight: typography.weight.bold, color: typography.color.primary }}>
            Almoço · {block.startTime}–{block.endTime}
          </div>
          <div style={{ fontSize: 11.5, color: typography.color.muted, marginTop: 1 }}>
            {rotuloData(data)}
          </div>
        </div>
        {conteudo}
      </div>
    </>,
    document.body,
  )
}

const inputHora: React.CSSProperties = {
  // 16px evita o zoom automatico do Safari iOS ao focar o campo.
  fontSize: 16,
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 700,
  fontFamily: 'inherit',
  height: 44,
  width: 112,
  padding: '0 12px',
  borderRadius: 10,
  border: `1.5px solid ${colors.gray.borderMd}`,
  background: colors.background.surface,
  color: colors.gray[900],
}

const botao: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 13.5,
  fontWeight: typography.weight.semibold,
  minHeight: 44,
  padding: '0 16px',
  borderRadius: 10,
  border: `1px solid ${colors.gray.borderMd}`,
  background: colors.background.surface,
  color: colors.gray[900],
  cursor: 'pointer',
}
