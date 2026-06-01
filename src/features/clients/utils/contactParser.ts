// src/features/clients/utils/contactParser.ts
//
// Parseia contatos de várias origens → RawContact[].
// Suporta: texto colado (linhas "Nome, telefone"), CSV (com cabeçalho), vCard (.vcf).
// O parsing é só de FORMATO — validação/normalização acontece no backend (/import/preview).

export interface RawContact {
  name:   string
  phone:  string
  email?: string | null
  cpf?:   string | null
}

// ─── Detecção de telefone num texto livre ──────────────────────────────────
// Captura sequências que parecem telefone: dígitos, +, (), -, espaços.
const PHONE_RE = /(\+?\d[\d\s().-]{7,})/

function looksLikePhone(s: string): boolean {
  const digits = s.replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 15
}

function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}

// ─── 1. TEXTO COLADO ────────────────────────────────────────────────────────
// Cada linha é um contato. Formatos aceitos:
//   "João Silva, (11) 98765-4321"
//   "João Silva 11987654321"
//   "11987654321 João Silva"
//   "João Silva; 11987654321; joao@email.com"
export function parsePastedText(text: string): RawContact[] {
  const out: RawContact[] = []
  const lines = text.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Divide por vírgula, ponto-e-vírgula ou tab (separadores comuns)
    const parts = trimmed.split(/[,;\t]/).map(p => p.trim()).filter(Boolean)

    let name = ''
    let phone = ''
    let email: string | null = null

    if (parts.length > 1) {
      // Tem separadores: identifica cada parte
      for (const p of parts) {
        if (!phone && looksLikePhone(p)) { phone = p; continue }
        if (!email && looksLikeEmail(p)) { email = p; continue }
        if (!name) name = p
      }
      // Se ainda sem nome, usa a primeira parte que não é phone/email
      if (!name) name = parts.find(p => !looksLikePhone(p) && !looksLikeEmail(p)) ?? ''
    } else {
      // Sem separador: tenta achar o telefone dentro da linha e o resto é nome
      const m = trimmed.match(PHONE_RE)
      if (m && looksLikePhone(m[1])) {
        phone = m[1].trim()
        name = trimmed.replace(m[1], '').trim()
      } else {
        name = trimmed
      }
    }

    if (!phone && !name) continue
    out.push({ name: name || 'Sem nome', phone, email })
  }

  return out
}

// ─── 2. CSV ───────────────────────────────────────────────────────────────────
// Detecta colunas pelo cabeçalho (nome/name, telefone/phone/celular, email, cpf).
// Se não houver cabeçalho reconhecível, cai no parser de texto.
export function parseCSV(text: string): RawContact[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length === 0) return []

  const delimiter = lines[0].includes(';') ? ';' : ','
  const header = lines[0].split(delimiter).map(h => h.trim().toLowerCase())

  const idxName  = header.findIndex(h => /nome|name/.test(h))
  const idxPhone = header.findIndex(h => /telefone|phone|celular|fone|whats/.test(h))
  const idxEmail = header.findIndex(h => /e-?mail/.test(h))
  const idxCpf   = header.findIndex(h => /cpf|documento/.test(h))

  // Sem cabeçalho reconhecível → trata como texto
  if (idxName === -1 && idxPhone === -1) {
    return parsePastedText(text)
  }

  const out: RawContact[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i], delimiter)
    const name  = idxName  >= 0 ? (cols[idxName]  ?? '').trim() : ''
    const phone = idxPhone >= 0 ? (cols[idxPhone] ?? '').trim() : ''
    const email = idxEmail >= 0 ? (cols[idxEmail] ?? '').trim() : ''
    const cpf   = idxCpf   >= 0 ? (cols[idxCpf]   ?? '').trim() : ''
    if (!name && !phone) continue
    out.push({
      name: name || 'Sem nome',
      phone,
      email: email || null,
      cpf:   cpf || null,
    })
  }
  return out
}

// Split de linha CSV respeitando aspas
function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === delimiter && !inQuotes) { result.push(cur); cur = ''; continue }
    cur += ch
  }
  result.push(cur)
  return result.map(s => s.trim())
}

// ─── 3. vCard (.vcf) ──────────────────────────────────────────────────────────
// Parser simples de vCard 2.1/3.0/4.0. Pega FN (nome), TEL, EMAIL.
export function parseVCard(text: string): RawContact[] {
  const out: RawContact[] = []
  // Cada contato começa em BEGIN:VCARD e termina em END:VCARD
  const cards = text.split(/BEGIN:VCARD/i).slice(1)

  for (const card of cards) {
    const body = card.split(/END:VCARD/i)[0]
    const lines = body.split(/\r?\n/)

    let name = ''
    let fallbackName = ''
    let phone = ''
    let email: string | null = null

    for (const raw of lines) {
      const line = raw.trim()
      if (!line) continue

      const upper = line.toUpperCase()

      // FN: nome formatado (preferido)
      if (upper.startsWith('FN')) {
        const v = line.split(':').slice(1).join(':').trim()
        if (v) name = v
      }
      // N: nome estruturado (sobrenome;nome;...) — fallback
      else if (upper.startsWith('N:') || upper.startsWith('N;')) {
        const v = line.split(':').slice(1).join(':').trim()
        if (v) fallbackName = v.split(';').filter(Boolean).reverse().join(' ').trim()
      }
      // TEL: telefone (pega o primeiro)
      else if (upper.startsWith('TEL')) {
        if (!phone) {
          const v = line.split(':').slice(1).join(':').trim()
          if (v) phone = v
        }
      }
      // EMAIL
      else if (upper.startsWith('EMAIL')) {
        if (!email) {
          const v = line.split(':').slice(1).join(':').trim()
          if (v) email = v
        }
      }
    }

    const finalName = name || fallbackName || 'Sem nome'
    if (!phone && finalName === 'Sem nome') continue
    out.push({ name: finalName, phone, email })
  }

  return out
}

// ─── Dispatcher por tipo de arquivo/conteúdo ──────────────────────────────────
export function parseFile(filename: string, content: string): RawContact[] {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.vcf') || /BEGIN:VCARD/i.test(content)) return parseVCard(content)
  if (lower.endsWith('.csv')) return parseCSV(content)
  // tsv ou txt → tenta CSV (que cai pra texto se não tiver cabeçalho)
  return parseCSV(content)
}
