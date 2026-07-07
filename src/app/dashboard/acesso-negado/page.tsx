import ErrorScreen from '@/app/components/errors/ErrorScreen'

export const metadata = { title: 'Acesso negado — Eligi' }

interface PageProps {
  searchParams: Promise<{ from?: string }>
}

export default async function AcessoNegadoPage({ searchParams }: PageProps) {
  const { from } = await searchParams
  return <ErrorScreen kind="denied" route={from} />
}
