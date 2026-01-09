'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { hoursSchema } from './schema';
import { useOnboardingStore } from '../../store';

import { api } from '@/lib/api';

type Day = {
  weekday: number;
  label: string;
};

const DAYS: Day[] = [
  { weekday: 0, label: 'Domingo' },
  { weekday: 1, label: 'Segunda-feira' },
  { weekday: 2, label: 'Terça-feira' },
  { weekday: 3, label: 'Quarta-feira' },
  { weekday: 4, label: 'Quinta-feira' },
  { weekday: 5, label: 'Sexta-feira' },
  { weekday: 6, label: 'Sábado' }
];

export default function HoursStep() {
  const router = useRouter();
  const setData = useOnboardingStore((s) => s.setData);

  const [hours, setHours] = useState<
    {
      weekday: number;
      startTime: string;
      endTime: string;
      enabled: boolean;
    }[]
  >(
    DAYS.map((d) => ({
      weekday: d.weekday,
      startTime: '10:00',
      endTime: '20:00',
      enabled: d.weekday !== 0
    }))
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(index: number) {
    setHours((prev) =>
      prev.map((h, i) =>
        i === index
          ? { ...h, enabled: !h.enabled }
          : h
      )
    );
  }

  function updateTime(
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) {
    setHours((prev) =>
      prev.map((h, i) =>
        i === index ? { ...h, [field]: value } : h
      )
    );
  }

  async function handleContinue() {
    if (loading) return;

    const payload = {
      hours: hours
        .filter((h) => h.enabled)
        .map((h) => ({
          weekday: h.weekday,
          startTime: h.startTime,
          endTime: h.endTime
        }))
    };

    const result = hoursSchema.safeParse(payload);

    if (!result.success) {
      setError(
        result.error.flatten().formErrors[0]
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.post('/onboarding/business-hours', payload);

      setData({ hours: payload.hours });

      router.push('/onboarding/steps/05-team');
    } catch {
      // erro tratado globalmente
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {hours.map((day, index) => (
        <div
          key={day.weekday}
          className="flex items-center gap-4"
        >
          <input
            type="checkbox"
            checked={day.enabled}
            onChange={() => toggleDay(index)}
          />

          <span className="w-32 text-sm">
            {DAYS[index].label}
          </span>

          <input
            type="time"
            value={day.startTime}
            disabled={!day.enabled}
            onChange={(e) =>
              updateTime(
                index,
                'startTime',
                e.target.value
              )
            }
            className="input-base"
          />

          <span>–</span>

          <input
            type="time"
            value={day.endTime}
            disabled={!day.enabled}
            onChange={(e) =>
              updateTime(
                index,
                'endTime',
                e.target.value
              )
            }
            className="input-base"
          />
        </div>
      ))}

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex justify-end pt-4">
        <button
          onClick={handleContinue}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Salvando...' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
