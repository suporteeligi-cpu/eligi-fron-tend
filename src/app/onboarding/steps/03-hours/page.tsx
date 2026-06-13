'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

import { useOnboardingStore } from '../../store';
import { api } from '@/lib/api';

type Day = {
  weekday: number;
  label: string;
  open: boolean;
  startTime: string;
  endTime: string;
};

// Convenção: 0=Dom ... 6=Sáb. Domingo fechado por padrão.
const DEFAULT_DAYS: Day[] = [
  { weekday: 0, label: 'Domingo', open: false, startTime: '09:00', endTime: '18:00' },
  { weekday: 1, label: 'Segunda', open: true, startTime: '09:00', endTime: '19:00' },
  { weekday: 2, label: 'Terça', open: true, startTime: '09:00', endTime: '19:00' },
  { weekday: 3, label: 'Quarta', open: true, startTime: '09:00', endTime: '19:00' },
  { weekday: 4, label: 'Quinta', open: true, startTime: '09:00', endTime: '19:00' },
  { weekday: 5, label: 'Sexta', open: true, startTime: '09:00', endTime: '19:00' },
  { weekday: 6, label: 'Sábado', open: true, startTime: '09:00', endTime: '18:00' },
];

export default function HoursStep() {
  const router = useRouter();
  const setData = useOnboardingStore((s) => s.setData);

  const [days, setDays] = useState<Day[]>(DEFAULT_DAYS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(weekday: number, patch: Partial<Day>) {
    setDays((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)));
  }

  async function handleContinue() {
    if (loading) return;
    const hours = days
      .filter((d) => d.open)
      .map((d) => ({ weekday: d.weekday, startTime: d.startTime, endTime: d.endTime }));

    if (hours.length === 0) {
      setError('Marque pelo menos um dia de funcionamento.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.post('/onboarding/hours', { hours });
      setData({ hours });
      router.push('/onboarding/steps/04-services');
    } catch {
      setError('Não foi possível salvar agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs text-neutral-500">Passo 3 de 5</p>
        <h1 className="text-xl font-semibold">Horário de funcionamento</h1>
        <p className="text-sm text-neutral-500">Já deixamos um padrão — ajuste se precisar.</p>
      </div>

      <div className="space-y-2">
        {days.map((d) => (
          <div
            key={d.weekday}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3"
          >
            <button
              type="button"
              onClick={() => update(d.weekday, { open: !d.open })}
              className={`relative w-10 h-6 rounded-full transition ${d.open ? 'bg-red-600' : 'bg-neutral-300'}`}
              aria-label={d.open ? 'Aberto' : 'Fechado'}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${d.open ? 'left-[1.125rem]' : 'left-0.5'}`}
              />
            </button>

            <span className="w-20 text-sm">{d.label}</span>

            {d.open ? (
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="time"
                  value={d.startTime}
                  onChange={(e) => update(d.weekday, { startTime: e.target.value })}
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
                />
                <span className="text-neutral-400">–</span>
                <input
                  type="time"
                  value={d.endTime}
                  onChange={(e) => update(d.weekday, { endTime: e.target.value })}
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
                />
              </div>
            ) : (
              <span className="ml-auto text-sm text-neutral-400">Fechado</span>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={() => router.push('/onboarding/steps/02-location')}
          className="text-sm text-neutral-500"
        >
          Voltar
        </button>
        <button
          onClick={handleContinue}
          disabled={loading}
          className="btn-primary inline-flex items-center gap-2"
        >
          {loading ? 'Salvando...' : (
            <>
              Continuar <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
