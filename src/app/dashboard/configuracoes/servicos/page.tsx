// src/app/dashboard/configuracoes/servicos/page.tsx
//
// @eligi:config-servicos-morta
// Esta rota abrigava uma SEGUNDA implementacao completa do modulo de Servicos:
// 448 linhas com `Service`, `formatPrice`, `groupByCategory` e `ColorPicker`
// proprios, mais uma paleta SERVICE_COLORS hardcoded que ja divergia da paleta
// compartilhada com a agenda. Todo campo novo do servico precisava ser escrito
// duas vezes, e a segunda copia sempre atrasava.
//
// A tela canonica e /dashboard/servicos (page + components/). A rota antiga fica
// de pe como redirect para nao quebrar link salvo pelo lojista.
import { redirect } from 'next/navigation'

export default function ConfiguracoesServicosPage() {
  redirect('/dashboard/servicos')
}
