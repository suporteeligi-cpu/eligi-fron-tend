"use client"
// src/app/dashboard/financeiro/comissoes/components/PendingCommissionsTab.tsx

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Loader2, Sparkles, AlertCircle, Briefcase, Package, Calendar, Clock,
} from "lucide-react"
import api from "@/shared/lib/apiClient"
import { colors, typography, radius, shadows } from "@/shared/theme"
import {
  PendingProfessionalSplit, PendingSummaryResponse, ClosedPeriodInfo,
  PayoutListItem, PayoutSettings,
} from "@/features/payouts/types"
import { fmtBRL } from "@/features/payouts/utils/format"
import PayoutCard from "./PayoutCard"

interface Props {
  isMobile: boolean
  settings: PayoutSettings | null
  onOpenDetail: (payoutId: string) => void
  onPayPayout:  (payout: PayoutListItem) => void
  refreshSignal: number
}

const EMPTY_SUMMARY: PendingSummaryResponse = { closedPeriod: null, professionals: [] }

/** "Ter 29/06" a partir de um ISO. Fuso do navegador (datas já vêm em BRT do back). */
function fmtDayLabel(iso: string): string {
  const d = new Date(iso)
  const wd = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")
  const dm = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)} ${dm}`
}

function initials(name: string): string {
  return (
    name.split(" ").slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase() || "?"
  )
}

export default function PendingCommissionsTab({
  isMobile, settings, onOpenDetail, onPayPayout, refreshSignal,
}: Props) {
  const [summary, setSummary]         = useState<PendingSummaryResponse>(EMPTY_SUMMARY)
  const [pendingPayouts, setPending]  = useState<PayoutListItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [generating, setGenerating]   = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [generateMsg, setGenerateMsg] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setError(null)
      const [summaryRes, payoutsRes] = await Promise.all([
        api.get("/payouts/commissions/pending-summary"),
        api.get("/payouts", { params: { status: "PENDING", limit: 100 } }),
      ])
      const raw = summaryRes.data?.data
      // Resiliência: back novo devolve objeto; se vier array (front/back defasado), normaliza.
      const normalized: PendingSummaryResponse = Array.isArray(raw)
        ? { closedPeriod: null, professionals: [] }
        : (raw ?? EMPTY_SUMMARY)
      setSummary({
        closedPeriod:  normalized.closedPeriod ?? null,
        professionals: Array.isArray(normalized.professionals) ? normalized.professionals : [],
      })
      const payoutsData = payoutsRes.data?.data ?? []
      setPending(Array.isArray(payoutsData) ? payoutsData : [])
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? "Erro ao carregar")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll, refreshSignal])

  const generate = useCallback(async () => {
    setGenerateMsg(null)
    setError(null)
    setGenerating(true)
    try {
      const res  = await api.post("/payouts/generate")
      const data = res.data?.data
      if (data?.generated > 0) {
        setGenerateMsg(`${data.generated} pagamento(s) gerado(s) com sucesso!`)
      } else {
        setGenerateMsg("Nenhum pagamento foi gerado (aguarde o dia de pagamento do período).")
      }
      await fetchAll()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? "Erro ao gerar pagamentos")
    } finally {
      setGenerating(false)
    }
  }, [fetchAll])

  // ── Derivados (memoizados) ────────────────────────────────────────────────
  const { closedPeriod, closedProfs, closedTotal, closedItems, currentTotal, currentItems } =
    useMemo(() => {
      const profs = summary.professionals
      const cp: ClosedPeriodInfo | null = summary.closedPeriod
      const cProfs = profs.filter(p => p.closedTotal > 0)
      return {
        closedPeriod: cp,
        closedProfs:  cProfs,
        closedTotal:  cProfs.reduce((s, p) => s + p.closedTotal, 0),
        closedItems:  cProfs.reduce((s, p) => s + p.closedCount, 0),
        currentTotal: profs.reduce((s, p) => s + p.currentTotal, 0),
        currentItems: profs.reduce((s, p) => s + p.currentCount, 0),
      }
    }, [summary])

  const hasClosed  = closedPeriod !== null && closedTotal > 0
  const hasCurrent = currentTotal > 0
  const hasAnything =
    summary.professionals.length > 0 || pendingPayouts.length > 0

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <Loader2 size={28} style={{ animation: "pos-spin 0.8s linear infinite", color: colors.red.DEFAULT }} />
        <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!hasAnything) {
    return (
      <div style={{
        textAlign: "center",
        padding: isMobile ? "48px 24px" : "64px 32px",
        background: "#fff",
        border: `1px solid ${colors.gray.border}`,
        borderRadius: radius.xl,
        fontFamily: typography.fontFamily,
      }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
        <div style={{ fontSize: typography.scale.lg, fontWeight: typography.weight.semibold, color: typography.color.primary, marginBottom: 6 }}>
          Nenhuma comissão pendente
        </div>
        <div style={{ fontSize: typography.scale.base, color: typography.color.muted }}>
          Todas as comissões da equipe já foram pagas. 👏
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, fontFamily: typography.fontFamily }}>
      {/* ─── ESTADO A: período fechado, pronto pra gerar ─── */}
      {hasClosed && closedPeriod && (
        <div style={{
          background: "linear-gradient(135deg, #fefce8, #fef3c7)",
          border: "1px solid rgba(217, 119, 6, 0.25)",
          borderRadius: radius.lg,
          padding: "14px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <AlertCircle size={15} color="#b45309" strokeWidth={2.2} />
            <div style={{
              fontSize: typography.scale.sm, fontWeight: typography.weight.bold,
              color: "#92400e", textTransform: "uppercase", letterSpacing: ".05em",
            }}>
              Comissões a serem agrupadas
            </div>
          </div>

          <div style={{
            fontSize: 26, fontWeight: typography.weight.bold, color: "#92400e",
            fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em",
            lineHeight: 1, marginBottom: 6,
          }}>
            {fmtBRL(closedTotal)}
          </div>

          {/* Rótulo do período fechado */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "3px 10px", marginBottom: 4,
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(217, 119, 6, 0.2)",
            borderRadius: 99,
            fontSize: 11, color: "#92400e", fontWeight: typography.weight.semibold,
          }}>
            <Calendar size={11} strokeWidth={2.2} />
            {fmtDayLabel(closedPeriod.start)} → {fmtDayLabel(closedPeriod.end)}
            <span style={{ opacity: 0.5 }}>·</span>
            pgto {fmtDayLabel(closedPeriod.scheduledFor)}
          </div>

          <div style={{ fontSize: typography.scale.sm, color: "#92400e", opacity: 0.85, marginBottom: 14 }}>
            {closedProfs.length} profissional{closedProfs.length !== 1 ? "is" : ""} · {closedItems} itens
          </div>

          {/* Lista por profissional (valor FECHADO) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {closedProfs.slice(0, 6).map(p => (
              <ProfRow key={p.professional.id} p={p} />
            ))}
            {closedProfs.length > 6 && (
              <div style={{ fontSize: typography.scale.xs, color: "#92400e", opacity: 0.7, textAlign: "center", paddingTop: 4 }}>
                + {closedProfs.length - 6} profissional(is)
              </div>
            )}
          </div>

          {/* Linha discreta: semana corrente NÃO incluída */}
          {hasCurrent && (
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 11px", marginBottom: 12,
              background: "rgba(255,255,255,0.5)",
              border: "1px dashed rgba(146, 64, 14, 0.28)",
              borderRadius: radius.sm,
              fontSize: typography.scale.xs, color: "#92400e",
            }}>
              <Clock size={12} strokeWidth={2.2} style={{ flexShrink: 0, opacity: 0.8 }} />
              <span style={{ flex: 1 }}>
                <strong style={{ fontWeight: typography.weight.bold }}>{fmtBRL(currentTotal)}</strong>{" "}
                do período em andamento ({currentItems} {currentItems === 1 ? "item" : "itens"}) —{" "}
                <span style={{ opacity: 0.75 }}>não entra neste pagamento</span>
              </span>
            </div>
          )}

          {/* CTA */}
          {settings?.enabled ? (
            <button
              onClick={generate}
              disabled={generating}
              style={{
                width: "100%", padding: "11px", borderRadius: radius.sm, border: "none",
                background: generating ? colors.gray.dimTextLight : "linear-gradient(135deg, #b45309, #92400e)",
                color: "#fff", fontSize: typography.scale.sm, fontWeight: typography.weight.bold,
                cursor: generating ? "not-allowed" : "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                boxShadow: shadows.sm, WebkitTapHighlightColor: "transparent",
              }}
            >
              {generating
                ? <Loader2 size={13} style={{ animation: "pos-spin 0.8s linear infinite" }} />
                : <Sparkles size={13} strokeWidth={2.4} />}
              {generating ? "Gerando…" : "Gerar pagamentos agora"}
            </button>
          ) : (
            <div style={{
              padding: "10px 12px", background: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(217, 119, 6, 0.25)", borderRadius: radius.sm,
              fontSize: typography.scale.sm, color: "#92400e", textAlign: "center",
            }}>
              ⚠️ Ative o sistema na configuração para gerar pagamentos
            </div>
          )}

          {generateMsg && (
            <div style={{
              marginTop: 10, padding: "8px 12px", background: "rgba(255,255,255,0.7)",
              borderRadius: radius.sm, fontSize: typography.scale.sm, color: "#92400e", textAlign: "center",
            }}>
              {generateMsg}
            </div>
          )}
          <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* ─── ESTADO B: só período corrente em andamento (nada a gerar ainda) ─── */}
      {!hasClosed && hasCurrent && (
        <div style={{
          background: "#fff",
          border: `1px solid ${colors.gray.border}`,
          borderRadius: radius.lg,
          padding: "14px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Clock size={15} color={colors.gray.dimText} strokeWidth={2.2} />
            <div style={{
              fontSize: typography.scale.sm, fontWeight: typography.weight.bold,
              color: typography.color.muted, textTransform: "uppercase", letterSpacing: ".05em",
            }}>
              Período em andamento
            </div>
          </div>
          <div style={{
            fontSize: 24, fontWeight: typography.weight.bold, color: typography.color.primary,
            fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 4,
          }}>
            {fmtBRL(currentTotal)}
          </div>
          <div style={{ fontSize: typography.scale.sm, color: typography.color.muted, marginBottom: 12 }}>
            Acumulando · fecha no fim do período · {currentItems} {currentItems === 1 ? "item" : "itens"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {summary.professionals
              .filter(p => p.currentTotal > 0)
              .slice(0, 6)
              .map(p => (
                <ProfRow key={p.professional.id} p={p} useCurrent />
              ))}
          </div>
        </div>
      )}

      {/* ─── Payouts PENDING já gerados ─── */}
      {pendingPayouts.length > 0 && (
        <div>
          <div style={{
            fontSize: typography.scale.xs, fontWeight: typography.weight.bold,
            color: typography.color.muted, textTransform: "uppercase",
            letterSpacing: ".07em", marginBottom: 10,
          }}>
            Pagamentos pendentes ({pendingPayouts.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingPayouts.map(p => (
              <PayoutCard key={p.id} payout={p} onClick={() => onOpenDetail(p.id)} onPay={() => onPayPayout(p)} />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: "10px 12px", background: "rgba(220,38,38,0.08)",
          border: `1px solid ${colors.red.border}`, borderRadius: radius.sm,
          fontSize: typography.scale.sm, color: colors.red.DEFAULT,
        }}>
          {error}
        </div>
      )}
    </div>
  )
}

// ─── Linha de profissional ─────────────────────────────────────────────────
function ProfRow({ p, useCurrent = false }: { p: PendingProfessionalSplit; useCurrent?: boolean }) {
  const svc  = useCurrent ? p.currentServiceTotal : p.closedServiceTotal
  const prod = useCurrent ? p.currentProductTotal : p.closedProductTotal
  const main = useCurrent ? p.currentTotal : p.closedTotal
  const showCurrentBadge = !useCurrent && p.currentTotal > 0

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 10px",
      background: useCurrent ? colors.background.page : "rgba(255,255,255,0.6)",
      borderRadius: radius.sm,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: "50%", background: colors.red.gradient,
        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: typography.weight.bold, flexShrink: 0,
      }}>
        {initials(p.professional.name)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: typography.scale.sm, fontWeight: typography.weight.semibold,
          color: typography.color.primary,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {p.professional.name}
        </div>
        <div style={{ fontSize: 10, color: typography.color.muted, display: "flex", gap: 8 }}>
          {svc > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Briefcase size={9} /> {fmtBRL(svc)}
            </span>
          )}
          {prod > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Package size={9} /> {fmtBRL(prod)}
            </span>
          )}
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontSize: typography.scale.sm, fontWeight: typography.weight.bold,
          color: useCurrent ? typography.color.primary : "#92400e",
          fontVariantNumeric: "tabular-nums",
        }}>
          {fmtBRL(main)}
        </div>
        {showCurrentBadge && (
          <div style={{ fontSize: 10, color: typography.color.muted, fontVariantNumeric: "tabular-nums" }}>
            + {fmtBRL(p.currentTotal)} esta semana
          </div>
        )}
      </div>
    </div>
  )
}
