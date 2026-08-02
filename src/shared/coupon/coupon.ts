/* =========================================
   @eligi:coupon-capture
   Captura do cupom de campanha vindo do link (?cupom=AGOSTO26).

   O localStorage aqui e TRANSPORTE DE CURTA DISTANCIA — vive os segundos
   entre o clique no link e o login. Assim que o usuario autentica, o codigo
   vai pro servidor (pendingCouponCode) e o armazenamento local vira
   descartavel. Nao dependemos dele por dias: o ITP do Safari limpa
   localStorage apos ~7 dias sem interacao, e o trial dura exatamente 7.

   Modulo PURO: sem rede, sem apiClient. Roda em pagina publica, sem sessao.
========================================= */

export const COUPON_STORAGE_KEY = 'eligi-coupon';

/** Nomes de query param aceitos (o link em PT-BR e o canonico). */
const PARAM_NAMES = ['cupom', 'coupon'] as const;

const MAX_CODE_LENGTH = 32;

/**
 * Normalizacao canonica — ESPELHA o backend (billing.coupon.service.ts).
 * " agosto26! " -> "AGOSTO26". Se divergir do back, o front valida um codigo
 * e o servidor recusa outro.
 */
export function normalizeCouponCode(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, MAX_CODE_LENGTH);
}

/** Preview devolvido por /billing/coupon/preview e /claim. */
export interface CouponPreview {
  code: string;
  label: string;
  prices: { autonomo: number; estabelecimento: number; extraSeat: number };
  regularPrices: { autonomo: number; estabelecimento: number; extraSeat: number };
  addon: number;
}

/** Le o codigo guardado. Null se nao houver (ou se o storage estiver bloqueado). */
export function readStoredCoupon(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COUPON_STORAGE_KEY);
    if (!raw) return null;
    const code = normalizeCouponCode(raw);
    return code.length > 0 ? code : null;
  } catch {
    // Safari em navegacao privada lanca em localStorage. Sem cupom > sem app.
    return null;
  }
}

/** Guarda o codigo. Silencioso em falha — cupom nunca pode quebrar a pagina. */
export function storeCoupon(code: string): void {
  if (typeof window === 'undefined') return;
  const normalized = normalizeCouponCode(code);
  if (!normalized) return;
  try {
    window.localStorage.setItem(COUPON_STORAGE_KEY, normalized);
  } catch {
    // storage indisponivel: o fallback e o campo manual na tela de assinatura
  }
}

/** Descarta o codigo guardado (apos o claim, ou quando o servidor recusa). */
export function clearStoredCoupon(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(COUPON_STORAGE_KEY);
  } catch {
    // idem
  }
}

/**
 * Le o ?cupom= da URL atual, guarda e REMOVE o parametro do endereco.
 *
 * A limpeza evita que o lojista compartilhe o proprio link com o codigo
 * colado. Usa replaceState: nao empilha entrada no historico, entao o botao
 * voltar continua fazendo o que a pessoa espera.
 *
 * Devolve o codigo capturado nesta chamada, ou null.
 */
export function captureCouponFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  let url: URL;
  try {
    url = new URL(window.location.href);
  } catch {
    return null;
  }

  let found: string | null = null;
  let dirty = false;
  for (const name of PARAM_NAMES) {
    const value = url.searchParams.get(name);
    if (value === null) continue;
    dirty = true;
    url.searchParams.delete(name);
    const code = normalizeCouponCode(value);
    if (code && !found) found = code;
  }

  if (found) storeCoupon(found);

  if (dirty) {
    try {
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch {
      // replaceState bloqueado (iframe sandbox): o codigo ja foi guardado
    }
  }

  return found;
}
