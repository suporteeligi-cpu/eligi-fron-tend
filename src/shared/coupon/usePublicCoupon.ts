/* @eligi:coupon-public-hook
   Cupom de campanha em pagina PUBLICA (landing), sem sessao.

   Valida no servidor de proposito: confiar no ?cupom= da URL faria a landing
   prometer R$39,90 para quem digitasse ?cupom=BANANA — promessa que a
   assinatura desmentiria depois. Preco na tela sempre vem do servidor.
*/
'use client';

import { useEffect, useState } from 'react';
import api from '@/shared/lib/apiClient';
import { captureCouponFromUrl, readStoredCoupon } from './coupon';

export interface PublicCoupon {
  code: string;
  prices: { autonomo: number; estabelecimento: number; extraSeat: number };
  regularPrices: { autonomo: number; estabelecimento: number; extraSeat: number };
  addon: number;
}

/**
 * Cupom valido para exibicao publica, ou null.
 *
 * Le a URL ANTES do localStorage: o CouponCapture do layout raiz monta em
 * paralelo, e depender so do storage criaria corrida no primeiro load —
 * exatamente o load que veio do story.
 */
export function usePublicCoupon(): PublicCoupon | null {
  const [coupon, setCoupon] = useState<PublicCoupon | null>(null);

  useEffect(() => {
    const code = captureCouponFromUrl() ?? readStoredCoupon();
    if (!code) return;
    let alive = true;
    api
      .post<{ data: PublicCoupon }>('/billing/coupon/public-preview', { code })
      .then((res) => {
        if (alive) setCoupon(res.data?.data ?? null);
      })
      .catch(() => {
        // codigo invalido/expirado: a landing mostra a tabela oficial.
        // Nunca quebra a pagina por causa de cupom.
      });
    return () => {
      alive = false;
    };
  }, []);

  return coupon;
}
