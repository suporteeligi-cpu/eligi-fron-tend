/* @eligi:coupon-capture-component
   Montado UMA vez no layout raiz. Captura o ?cupom= em qualquer pagina —
   landing, cadastro ou dashboard — porque o link da campanha pode cair em
   qualquer uma delas.

   Nao renderiza nada e nao tem estado: o efeito so escreve em localStorage
   e reescreve a URL. Sem setState, entao nada para o React Compiler reclamar.
*/
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureCouponFromUrl } from './coupon';

export default function CouponCapture() {
  // Navegacao client-side nao remonta o componente: sem estas deps, um link
  // interno com ?cupom= passaria batido.
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    captureCouponFromUrl();
  }, [pathname, query]);

  return null;
}
