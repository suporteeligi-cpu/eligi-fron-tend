'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { basicInfoSchema } from './schema';
import { useOnboardingStore } from '../../store';

import { api } from '@/lib/api';

export default function BasicInfoStep() {
  const router = useRouter();
  const setData = useOnboardingStore((s) => s.setData);

  const [displayName, setDisplayName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    businessType?: string;
  }>({});

  async function handleContinue() {
    if (loading) return;

    const result = basicInfoSchema.safeParse({
      displayName,
      businessType
    });

    if (!result.success) {
      const fieldErrors =
        result.error.flatten().fieldErrors;

      setErrors({
        displayName: fieldErrors.displayName?.[0],
        businessType: fieldErrors.businessType?.[0]
      });

      return;
    }

    try {
      setLoading(true);

      await api.post('/onboarding/about-you', {
        displayName,
        businessType
      });

      setData({
        displayName,
        businessType
      });

      router.push('/onboarding/steps/03-location');
    } catch {
      // erro global (toast / interceptor)
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm">
          Nome do negócio
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) =>
            setDisplayName(e.target.value)
          }
          className="input-base w-full"
          placeholder="Ex: Gil Barber"
        />
        {errors.displayName && (
          <p className="text-sm text-red-500">
            {errors.displayName}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm">
          Tipo do negócio
        </label>
        <input
          type="text"
          value={businessType}
          onChange={(e) =>
            setBusinessType(e.target.value)
          }
          className="input-base w-full"
          placeholder="Ex: Barbearia, Salão, Estúdio"
        />
        {errors.businessType && (
          <p className="text-sm text-red-500">
            {errors.businessType}
          </p>
        )}
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
