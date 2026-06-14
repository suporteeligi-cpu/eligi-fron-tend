'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft } from 'lucide-react';

import { useOnboardingStore } from '../../store';
import { api } from '@/lib/api';

type Day = {
  weekday: number;
  label: string;
  open: boolean;
  startTime: string;
  endTime: string;
};

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
    <div>
      <p className="ob-eyebrow ob-anim">Passo 3 de 5</p>
      <h1 className="ob-title ob-anim" style={{ animationDelay: '.05s' }}>Horário de funcionamento</h1>
      <p className="ob-subtitle ob-anim" style={{ animationDelay: '.1s' }}>
        Já deixamos um padrão — ajuste se precisar.
      </p>

      <div>
        {days.map((d, i) => (
          <div key={d.weekday} className="ob-day-row ob-anim" style={{ animationDelay: `${0.1 + i * 0.04}s` }}>
            <button
              type="button"
              onClick={() => update(d.weekday, { open: !d.open })}
              className={d.open ? 'ob-sw ob-sw--on' : 'ob-sw'}
              aria-label={d.open ? 'Aberto' : 'Fechado'}
            >
              <span className="ob-sw-knob" />
            </button>

            <span className="ob-day-label">{d.label}</span>

            {d.open ? (
              <div className="ob-day-times">
                <input
                  type="time"
                  value={d.startTime}
                  onChange={(e) => update(d.weekday, { startTime: e.target.value })}
                  className="ob-time-input"
                />
                <span className="ob-day-sep">até</span>
                <input
                  type="time"
                  value={d.endTime}
                  onChange={(e) => update(d.weekday, { endTime: e.target.value })}
                  className="ob-time-input"
                />
              </div>
            ) : (
              <span className="ob-day-closed">Fechado</span>
            )}
          </div>
        ))}
      </div>

      {error && <p className="ob-error">{error}</p>}

      <div className="ob-nav ob-anim" style={{ animationDelay: '.45s' }}>
        <button
          type="button"
          onClick={() => router.push('/onboarding/steps/02-location')}
          className="ob-btn-back"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <button onClick={handleContinue} disabled={loading} className="ob-btn-next">
          {loading ? 'Salvando...' : (<>Continuar <ArrowRight size={16} /></>)}
        </button>
      </div>
    </div>
  );
}
