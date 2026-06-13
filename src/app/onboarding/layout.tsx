'use client';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ProgressBar } from './components/ProgressBar';
import { StepFooter } from './components/StepFooter';
import { StepTitle } from './components/StepTitle';
import { getMe } from '@/lib/auth.api';

// NOTE: estas rotas ainda são as 7 do fluxo antigo. A leva 2 (rebuild do
// wizard) troca para as 5 telas do Modelo C e ajusta o ProgressBar.
const STEP_ROUTES = [
  '/onboarding/steps/01-business-type',
  '/onboarding/steps/02-basic-info',
  '/onboarding/steps/03-location',
  '/onboarding/steps/04-hours',
  '/onboarding/steps/05-team',
  '/onboarding/steps/06-services',
  '/onboarding/steps/07-review',
];

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        const me = await getMe();
        if (cancelled) return;

        // Já concluiu o onboarding → fora do wizard
        if (me.onboardingDone) {
          router.replace('/dashboard');
          return;
        }

        // Não deixa pular para um passo à frente do salvo no backend
        const step = me.onboardingStep ?? 1;
        const allowedIndex = step - 1;
        const currentIndex = STEP_ROUTES.findIndex((r) => pathname.startsWith(r));
        if (currentIndex !== -1 && currentIndex > allowedIndex) {
          router.replace(STEP_ROUTES[allowedIndex]);
          return;
        }

        setChecking(false);
      } catch {
        // Não autenticado / erro → login
        if (!cancelled) router.replace('/login');
      }
    }

    sync();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <div style={gateStyle}>
        <style>{`@keyframes eligi-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={spinnerStyle} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ProgressBar steps={STEP_ROUTES.length} />
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">
        <StepTitle
          title="Configuração do negócio"
          subtitle="Siga os passos para concluir seu cadastro"
        />
        {children}
      </main>
      <StepFooter />
    </div>
  );
}

const gateStyle: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
const spinnerStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: '3px solid rgba(220,38,38,0.15)',
  borderTop: '3px solid #dc2626',
  animation: 'eligi-spin 0.9s linear infinite',
};
