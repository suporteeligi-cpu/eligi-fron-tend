'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useOnboardingStore } from '../../store';

export default function ReviewStep() {
  const router = useRouter();
  const reset = useOnboardingStore((s) => s.reset);

  async function finish() {
    await api.post('/onboarding/review');
    reset();
    router.push('/dashboard');
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">
        Tudo pronto 🎉
      </h2>

      <p className="opacity-80">
        Seu negócio foi configurado com sucesso.
      </p>

      <div className="flex justify-end">
        <button onClick={finish} className="btn-primary">
          Ir para o painel
        </button>
      </div>
    </div>
  );
}
