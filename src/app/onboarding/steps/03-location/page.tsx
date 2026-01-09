'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { locationSchema } from './schema';
import { useOnboardingStore } from '../../store';

import { api } from '@/lib/api';

export default function LocationStep() {
  const router = useRouter();
  const setData = useOnboardingStore((s) => s.setData);

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('BR');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<
      'name' | 'city' | 'state' | 'country' | 'timezone',
      string
    >>
  >({});

  async function handleContinue() {
    if (loading) return;

    const result = locationSchema.safeParse({
      name,
      city,
      state,
      country,
      timezone
    });

    if (!result.success) {
      const fieldErrors =
        result.error.flatten().fieldErrors;

      setErrors({
        name: fieldErrors.name?.[0],
        city: fieldErrors.city?.[0],
        state: fieldErrors.state?.[0],
        country: fieldErrors.country?.[0],
        timezone: fieldErrors.timezone?.[0]
      });

      return;
    }

    // ✅ correção ESLint: nada de expressão solta
    if (result.success) {
      setErrors({});
    }

    try {
      setLoading(true);

      await api.post('/onboarding/business-info', {
        name,
        city,
        state,
        country,
        timezone
      });

      setData({
        name,
        city,
        state,
        country,
        timezone
      });

      router.push('/onboarding/steps/04-hours');
    } catch {
      // erro tratado globalmente
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm">
          Nome legal do negócio
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-base w-full"
          placeholder="Ex: Gil Barber LTDA"
        />
        {errors.name && (
          <p className="text-sm text-red-500">
            {errors.name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm">
            Cidade
          </label>
          <input
            value={city}
            onChange={(e) =>
              setCity(e.target.value)
            }
            className="input-base w-full"
          />
          {errors.city && (
            <p className="text-sm text-red-500">
              {errors.city}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm">
            Estado
          </label>
          <input
            value={state}
            onChange={(e) =>
              setState(e.target.value)
            }
            className="input-base w-full"
            placeholder="SP"
          />
          {errors.state && (
            <p className="text-sm text-red-500">
              {errors.state}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm">
            País
          </label>
          <input
            value={country}
            onChange={(e) =>
              setCountry(e.target.value)
            }
            className="input-base w-full"
          />
          {errors.country && (
            <p className="text-sm text-red-500">
              {errors.country}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm">
            Fuso horário
          </label>
          <input
            value={timezone}
            onChange={(e) =>
              setTimezone(e.target.value)
            }
            className="input-base w-full"
            placeholder="America/Sao_Paulo"
          />
          {errors.timezone && (
            <p className="text-sm text-red-500">
              {errors.timezone}
            </p>
          )}
        </div>
      </div>

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
