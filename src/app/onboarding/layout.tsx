'use client';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getMe } from '@/lib/auth.api';

// 5 passos do Modelo C (as pastas correspondentes são criadas nas partes 2 e 3)
const STEP_ROUTES = [
  '/onboarding/steps/01-identity',
  '/onboarding/steps/02-location',
  '/onboarding/steps/03-hours',
  '/onboarding/steps/04-services',
  '/onboarding/steps/05-plan',
];
const STEP_LABELS = ['Identidade', 'Onde fica', 'Horário', 'Serviço', 'Plano'];

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

        if (me.onboardingDone) {
          router.replace('/dashboard');
          return;
        }

        const step = me.onboardingStep ?? 1;
        const allowedIndex = step - 1;
        const idx = STEP_ROUTES.findIndex((r) => pathname.startsWith(r));
        if (idx !== -1 && idx > allowedIndex) {
          router.replace(STEP_ROUTES[allowedIndex]);
          return;
        }

        setChecking(false);
      } catch {
        if (!cancelled) router.replace('/login');
      }
    }

    sync();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  const currentIndex = STEP_ROUTES.findIndex((r) => pathname.startsWith(r));
  const stepNum = currentIndex === -1 ? 1 : currentIndex + 1;

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <style>{`@keyframes eligi-spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '3px solid rgba(220,38,38,0.15)',
            borderTop: '3px solid #dc2626',
            animation: 'eligi-spin 0.9s linear infinite',
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <style>{`
        @keyframes eligi-globe { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
        @media (prefers-reduced-motion: reduce) { .eligi-globe { animation: none !important; } }
      `}</style>

      {/* MOBILE — barra de progresso no topo */}
      <div className="md:hidden w-full h-1 bg-neutral-200">
        <div
          className="h-1 bg-red-600 transition-all duration-300"
          style={{ width: `${(stepNum / STEP_ROUTES.length) * 100}%` }}
        />
      </div>

      {/* DESKTOP — painel lateral */}
      <aside
        className="hidden md:flex md:w-[38%] lg:w-[32%] flex-col text-white p-7"
        style={{ background: '#dc2626' }}
      >
        <div className="mb-8" style={{ perspective: 260 }}>
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
            <svg
              className="eligi-globe"
              viewBox="0 0 64 64"
              width="36"
              height="36"
              aria-label="Eligi"
              style={{ animation: 'eligi-globe 2s linear infinite', transformStyle: 'preserve-3d' }}
            >
              <path fill="#16181d" d="M20 14c-5-1-9 2-9 6 0 3 3 4 4 6 1 1-1 2 0 4 2 1 4-1 6-2 1-2-1-4 1-6 2-2 0-6-2-8z" />
              <path fill="#16181d" d="M14 24c3 0 5 3 4 6-1 4-3 8-5 10-2-2-3-6-2-10 0-3 0-6 3-6z" />
              <path fill="#e8141b" d="M38 16c2-1 5 0 5 2 0 2-2 2-3 3-2 0-3-2-2-5z" />
              <path fill="#e8141b" d="M30 16c3 0 6 2 7 5 1 3 0 7-2 10-1 3-3 5-5 7-2-2-4-5-5-8-1-4-1-8 1-11 1-2 2-3 4-3z" />
            </svg>
          </div>
        </div>

        <div className="text-lg font-medium leading-snug mb-6">
          Configure seu<br />negócio em<br />minutos
        </div>

        <ol className="flex-1 space-y-3.5">
          {STEP_LABELS.map((label, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            const badgeStyle: React.CSSProperties = active
              ? { background: '#fff', color: '#dc2626' }
              : done
              ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
              : { border: '1px solid rgba(255,255,255,0.6)', color: '#fff' };
            return (
              <li
                key={label}
                className="flex items-center gap-2.5"
                style={{ opacity: active || done ? 1 : 0.55 }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={badgeStyle}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span className="text-sm">{label}</span>
              </li>
            );
          })}
        </ol>

        <div className="text-xs opacity-80 mt-4">Menos de 2 minutos</div>
      </aside>

      {/* CONTEÚDO DO PASSO */}
      <main className="flex-1 w-full max-w-xl mx-auto px-6 py-10 md:py-14">
        {children}
      </main>
    </div>
  );
}
