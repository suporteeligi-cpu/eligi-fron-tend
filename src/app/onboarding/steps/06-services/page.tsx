'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { servicesSchema } from './schema';
import { useOnboardingStore } from '../../store';
import { api } from '@/lib/api';

type ServiceForm = {
  name: string;
  duration: number;
  price: string;
};

export default function ServicesStep() {
  const router = useRouter();
  const setData = useOnboardingStore((s) => s.setData);

  const [services, setServices] = useState<ServiceForm[]>([
    { name: '', duration: 30, price: '' }
  ]);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ServiceForm>(
    index: number,
    field: K,
    value: ServiceForm[K]
  ) {
    setServices((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      )
    );
  }

  function addService() {
    setServices((prev) => [
      ...prev,
      { name: '', duration: 30, price: '' }
    ]);
  }

  async function handleContinue() {
    const payload = {
      services: services.map((s) => ({
        name: s.name,
        duration: Number(s.duration),
        price: s.price ? Number(s.price) : undefined
      }))
    };

    const result = servicesSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.flatten().formErrors[0]);
      return;
    }

    await api.post('/onboarding/services', payload);
    setData({ services: payload.services });

    router.push('/onboarding/steps/07-review');
  }

  return (
    <div className="space-y-6">
      {services.map((s, i) => (
        <div key={i} className="grid grid-cols-3 gap-3">
          <input
            className="input-base col-span-2"
            placeholder="Serviço"
            value={s.name}
            onChange={(e) =>
              update(i, 'name', e.target.value)
            }
          />
          <input
            className="input-base"
            type="number"
            placeholder="Min"
            value={s.duration}
            onChange={(e) =>
              update(i, 'duration', Number(e.target.value))
            }
          />
        </div>
      ))}

      <button onClick={addService} className="text-sm underline">
        + Adicionar serviço
      </button>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <div className="flex justify-end">
        <button onClick={handleContinue} className="btn-primary">
          Continuar
        </button>
      </div>
    </div>
  );
}
