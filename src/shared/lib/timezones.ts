// src/shared/lib/timezones.ts

export interface TimezoneOption {
  value:   string
  label:   string
  country: string
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  // ── Brasil ─────────────────────────────────────────────────
  { value: 'America/Sao_Paulo',  label: 'Brasília / São Paulo (UTC-3)',  country: 'BR' },
  { value: 'America/Manaus',     label: 'Manaus / Amazonas (UTC-4)',     country: 'BR' },
  { value: 'America/Cuiaba',     label: 'Cuiabá / MT (UTC-4)',           country: 'BR' },
  { value: 'America/Rio_Branco', label: 'Rio Branco / Acre (UTC-5)',     country: 'BR' },
  { value: 'America/Noronha',    label: 'Fernando de Noronha (UTC-2)',   country: 'BR' },
  // ── Internacional ─────────────────────────────────────────
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (UTC-3)',  country: 'AR' },
  { value: 'America/New_York',     label: 'Nova York (UTC-5)',     country: 'US' },
  { value: 'America/Los_Angeles',  label: 'Los Angeles (UTC-8)',   country: 'US' },
  { value: 'Europe/Lisbon',        label: 'Lisboa (UTC+0)',        country: 'PT' },
  { value: 'Europe/Madrid',        label: 'Madri (UTC+1)',         country: 'ES' },
  { value: 'UTC',                  label: 'UTC (Universal)',       country: 'XX' },
]

/** Detecta o timezone do navegador. Retorna string IANA ou null se falhar. */
export function detectBrowserTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return tz || null
  } catch {
    return null
  }
}

/** Acha label legível pro timezone. Se não estiver na lista, retorna o próprio value. */
export function labelForTimezone(value: string): string {
  const found = COMMON_TIMEZONES.find(t => t.value === value)
  return found?.label ?? value
}

/** Retorna o "agora" formatado no fuso especificado. Ex: "27/05/2026 22:30" */
export function formatNowInTz(tz: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone:   tz,
      day:        '2-digit',
      month:      '2-digit',
      year:       'numeric',
      hour:       '2-digit',
      minute:     '2-digit',
    }).format(new Date())
  } catch {
    return '—'
  }
}
