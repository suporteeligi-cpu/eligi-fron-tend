// src/features/sales-report/utils/index.ts
import { PaymentMethod, SaleReportStatus, ExportRow } from '../types'

export function fmtBRL(v: number): string {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

export function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function methodLabel(m: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    CASH:     'Dinheiro',
    PIX:      'PIX',
    CREDIT:   'Crédito',
    DEBIT:    'Débito',
    TRANSFER: 'Transferência',
    OTHER:    'Outros',
  }
  return map[m] ?? m
}

export function statusLabel(s: SaleReportStatus): string {
  const map: Record<SaleReportStatus, string> = {
    OPEN:      'Aberta',
    CONFIRMED: 'Confirmada',
    CANCELED:  'Cancelada',
  }
  return map[s] ?? s
}

// ─── Export CSV ────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  'Data', 'Status', 'Cliente', 'Itens', 'Profissionais', 'Métodos',
  'Subtotal', 'Desconto', 'Total', 'Nota Crédito', 'Comissão', 'Líquido',
] as const

function csvEscape(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportToCSV(rows: ExportRow[], filename: string) {
  const lines: string[] = []
  lines.push(CSV_HEADERS.join(','))

  for (const r of rows) {
    lines.push([
      csvEscape(r.data),
      csvEscape(r.status),
      csvEscape(r.cliente),
      csvEscape(r.itens),
      csvEscape(r.profissionais),
      csvEscape(r.metodos),
      csvEscape(r.subtotal.toFixed(2).replace('.', ',')),
      csvEscape(r.desconto.toFixed(2).replace('.', ',')),
      csvEscape(r.total.toFixed(2).replace('.', ',')),
      csvEscape(r.notaCredito.toFixed(2).replace('.', ',')),
      csvEscape(r.comissao.toFixed(2).replace('.', ',')),
      csvEscape(r.liquido.toFixed(2).replace('.', ',')),
    ].join(','))
  }

  // BOM pra Excel reconhecer UTF-8 (acentos)
  const bom = '\uFEFF'
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `${filename}.csv`)
}

// ─── Export Excel (.xlsx) via SheetJS dinâmico ───────────────────────────────

export async function exportToExcel(rows: ExportRow[], filename: string) {
  // Import dinâmico pra não pesar o bundle inicial
  const XLSX = await import('xlsx')

  const data = rows.map(r => ({
    'Data':          r.data,
    'Status':        r.status,
    'Cliente':       r.cliente,
    'Itens':         r.itens,
    'Profissionais': r.profissionais,
    'Métodos':       r.metodos,
    'Subtotal':      r.subtotal,
    'Desconto':      r.desconto,
    'Total':         r.total,
    'Nota Crédito':  r.notaCredito,
    'Comissão':      r.comissao,
    'Líquido':       r.liquido,
  }))

  const ws = XLSX.utils.json_to_sheet(data)

  // Larguras de coluna
  ws['!cols'] = [
    { wch: 18 }, { wch: 12 }, { wch: 22 }, { wch: 30 },
    { wch: 20 }, { wch: 16 }, { wch: 11 }, { wch: 11 },
    { wch: 11 }, { wch: 12 }, { wch: 11 }, { wch: 11 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Vendas')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Gera nome de arquivo com timestamp: vendas_2026-05-28 */
export function exportFilename(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `vendas_${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}
