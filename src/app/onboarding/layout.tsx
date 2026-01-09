'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { ProgressBar } from './components/ProgressBar';
import { StepFooter } from './components/StepFooter';
import { StepTitle } from './components/StepTitle';

import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

const STEP_ROUTES = [
  '/onboarding/steps/01-business-type',
  '/onboarding/steps/02-basic-info',
  '/onboarding/steps/03-location',
  '/onboarding/steps/04-hours',
  '/onboarding/steps/05-team',
  '/onboarding/steps/06-services',
  '/onboarding/steps/07-review'
];

export default function OnboardingLayout({
  children
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // não logado → login
    if (!user) {
      router.replace('/');
      return;
    }

    async function syncOnboarding() {
      try {
        const { data } = await api.get('/me');
        const stepFromBackend = data?.business?.onboardingStep ?? 1;

        const allowedIndex = stepFromBackend - 1;
        const currentIndex = STEP_ROUTES.findIndex((r) =>
          pathname.startsWith(r)
        );

        // impede pular steps reais
        if (
          currentIndex !== -1 &&
          currentIndex > allowedIndex
        ) {
          router.replace(STEP_ROUTES[allowedIndex]);
        }
      } catch {
        router.replace('/');
      }
    }

    syncOnboarding();
  }, [user, loading, pathname, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <ProgressBar steps={STEP_ROUTES.length} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">
        <StepTitle
  title="Configuração do negócio"
  subtitle="Siga os passos para concluir seu cadastro"/>

        {children}
      </main>

      <StepFooter />
    </div>
  );
}
