'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { businessTypeSchema } from './schema';
import { useOnboardingStore } from '../../store';

import { api } from '@/lib/api';

type JourneyType =
  | 'BUSINESS'
  | 'SOLO'
  | 'PERSONAL'
  | 'AFFILIATE';

const OPTIONS: {
  type: JourneyType;
  title: string;
  description: string;
}[] = [
  {
    type: 'BUSINESS',
    title: 'Empresa',
    description: 'Tenho um negócio com equipe e estrutura'
  },
  {
    type: 'SOLO',
    title: 'Profissional Solo',
    description: 'Trabalho sozinho e atendo clientes'
  },
  {
    type: 'PERSONAL',
    title: 'Uso Pessoal',
    description: 'Vou usar o sistema só para mim'
  },
  {
    type: 'AFFILIATE',
    title: 'Afiliado',
    description: 'Quero indicar e ganhar comissões'
  }
];

export default function BusinessTypeStep() {
  const router = useRouter();
  const setData = useOnboardingStore((s) => s.setData);

  const [selected, setSelected] =
    useState<JourneyType | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!selected || loading) return;

    try {
      setLoading(true);

      businessTypeSchema.parse({
        journeyType: selected
      });

      await api.post('/onboarding/start', {
        journeyType: selected
      });

      setData({ journeyType: selected });

      router.push('/onboarding/steps/02-basic-info');
    } catch {
      // erro tratado globalmente
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {OPTIONS.map((option) => {
          const active = selected === option.type;

          return (
            <button
              key={option.type}
              type="button"
              onClick={() => setSelected(option.type)}
              className={`
                text-left rounded-2xl border p-6 transition
                ${
                  active
                    ? 'border-red-500 bg-red-500/5'
                    : 'border-border hover:border-red-300'
                }
              `}
            >
              <h3 className="text-lg font-medium">
                {option.title}
              </h3>
              <p className="text-sm opacity-70 mt-1">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="btn-primary"
        >
          {loading ? 'Salvando...' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
