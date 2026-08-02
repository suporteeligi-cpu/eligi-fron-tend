/* @eligi:coupon-claim-hook
   Reivindica o cupom capturado do link, em QUALQUER tela autenticada.

   Existe como hook (e nao colado no BillingGuard) porque o onboarding fica
   FORA de /dashboard: sem isto, o step 05-plan mostraria a tabela cheia pra
   quem acabou de chegar pelo story. Duas telas, uma implementacao.
*/
'use client';

import { useEffect, useState } from 'react';
import api from '@/shared/lib/apiClient';
import { readStoredCoupon, clearStoredCoupon, type CouponPreview } from './coupon';

/**
 * Devolve o cupom aplicado (ou null). Roda uma vez por montagem.
 * Idempotente no servidor: reivindicar o mesmo codigo de novo nao duplica nada.
 */
export function useCouponClaim(): CouponPreview | null {
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);

  useEffect(() => {
    const code = readStoredCoupon();
    if (!code) return;
    const t = setTimeout(() => {
      api
        .post<{ data: CouponPreview }>('/billing/coupon/claim', { code })
        .then((res) => {
          setCoupon(res.data?.data ?? null);
          clearStoredCoupon();
        })
        .catch((e: unknown) => {
          const status = (e as { response?: { status?: number } })?.response?.status;
          // 401/403 = sessao ainda nao pronta (refresh em voo, pagina publica).
          // NUNCA descartar aqui: era o bug da versao anterior, que apagava o
          // cupom do lojista antes de ele conseguir usa-lo.
          if (status === 401 || status === 403) return;
          // Demais 4xx = codigo invalido/expirado/inelegivel: insistir a cada
          // load nao muda o resultado. 5xx e rede mantem pra proxima tentativa.
          if (typeof status === 'number' && status >= 400 && status < 500) clearStoredCoupon();
        });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return coupon;
}
