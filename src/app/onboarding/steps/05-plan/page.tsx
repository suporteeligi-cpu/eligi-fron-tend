'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Zap, Lock } from 'lucide-react';

import { useOnboardingStore } from '../../store';
import { api } from '@/lib/api';

type Plan = 'trial' | 'subscribe';

export default function PlanStep() {
  const router = useRouter();
  const setData = useOnboardingStore((s) => s.setData);

  const [plan, setPlan] = useState<Plan>('trial');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    if (loading || !accepted) return;
    try {
      setLoading(true);
      setError(null);
      await api.post('/onboarding/finish', { termsAccepted: true, plan });
      setData({ plan });
      // TODO(stripe): se plan === 'subscribe', abrir o checkout do Stripe
      // em vez de ir direto pro dashboard. Por ora ambos concluem o onboarding.
      router.replace('/dashboard');
    } catch {
      setError('Não foi possível concluir agora. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs text-neutral-500">Passo 5 de 5</p>
        <h1 className="text-xl font-semibold">Como você quer começar?</h1>
        <p className="text-sm text-neutral-500">Plano Solo · você pode mudar depois</p>
      </div>

      <button
        type="button"
        onClick={() => setPlan('trial')}
        className={`w-full text-left rounded-2xl border-2 p-4 transition ${plan === 'trial' ? 'border-red-500 bg-red-500/5' : 'border-neutral-200'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift size={20} className="text-red-600" />
            <span className="font-medium">7 dias grátis</span>
          </div>
          <span className="text-xs rounded-full bg-red-50 text-red-600 px-2.5 py-0.5">Sem cartão agora</span>
        </div>
        <p className="text-sm text-neutral-500 mt-2">
          Explore tudo sem pagar nada. No 8º dia a gente lembra e você decide.
        </p>
      </button>

      <button
        type="button"
        onClick={() => setPlan('subscribe')}
        className={`w-full text-left rounded-2xl border-2 p-4 transition ${plan === 'subscribe' ? 'border-red-500 bg-red-500/5' : 'border-neutral-200'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-neutral-600" />
            <span className="font-medium">Assinar agora</span>
          </div>
          <span className="text-sm font-medium">
            R$ 49<span className="text-xs text-neutral-500">/mês</span>
          </span>
        </div>
        <p className="text-sm text-neutral-500 mt-2">Ativa na hora, sem prazo. Para quem já está convencido.</p>
      </button>

      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Li e aceito os{' '}
          <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-red-600 underline">
            Termos de Uso
          </a>{' '}
          e a{' '}
          <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-red-600 underline">
            Política de Privacidade
          </a>
          .
        </span>
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={finish}
        disabled={!accepted || loading}
        className="btn-primary w-full disabled:opacity-50"
      >
        {loading
          ? 'Concluindo...'
          : plan === 'trial'
          ? 'Começar teste grátis'
          : 'Ir para o pagamento'}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
        <Lock size={12} /> Pagamento seguro via Stripe · cancele quando quiser
      </div>

      <div className="flex justify-start">
        <button
          type="button"
          onClick={() => router.push('/onboarding/steps/04-services')}
          className="text-sm text-neutral-500"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
