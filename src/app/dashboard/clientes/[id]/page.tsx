'use client'
// src/app/dashboard/clientes/[id]/page.tsx
// @eligi:clients-idpage-v2 — a ficha mora em ClientProfileView (a mesma do
// painel direito da lista no computador). Aqui so a casca da rota.

import { useParams } from 'next/navigation'

import { CLIENTS_CSS } from '@/features/clients/styles'
import ClientProfileView from './components/ClientProfileView'

export default function ClientProfilePage() {
  const params = useParams()
  const id = (params?.id as string | undefined) ?? ''

  return (
    <div className="cl-page" style={{ maxWidth: 860 }}>
      <style>{CLIENTS_CSS}</style>
      {id && <ClientProfileView key={id} id={id} />}
    </div>
  )
}
