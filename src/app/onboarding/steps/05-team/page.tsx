'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { teamSchema } from './schema';
import { useOnboardingStore } from '../../store';
import { api } from '@/lib/api';

type TeamMember = {
  name: string;
  email: string;
  role: string;
};

export default function TeamStep() {
  const router = useRouter();
  const setData = useOnboardingStore((s) => s.setData);

  const [team, setTeam] = useState<TeamMember[]>([
    { name: '', email: '', role: '' }
  ]);
  const [error, setError] = useState<string | null>(null);

  function update(
    index: number,
    field: keyof TeamMember,
    value: string
  ) {
    setTeam((prev) =>
      prev.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      )
    );
  }

  function addMember() {
    setTeam((prev) => [
      ...prev,
      { name: '', email: '', role: '' }
    ]);
  }

  async function handleContinue() {
    const payload = {
      team: team.map(({ email, ...rest }) => ({
        ...rest,
        email: email || undefined
      }))
    };

    const result = teamSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.flatten().formErrors[0]);
      return;
    }

    try {
      setError(null);

      await api.post('/onboarding/team', payload);
      setData({ team: payload.team });

      router.push('/onboarding/steps/06-services');
    } catch {
      // erro tratado globalmente
    }
  }

  return (
    <div className="space-y-6">
      {team.map((member, i) => (
        <div
          key={i}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <input
            className="input-base"
            placeholder="Nome"
            value={member.name}
            onChange={(e) =>
              update(i, 'name', e.target.value)
            }
          />
          <input
            className="input-base"
            placeholder="Email (opcional)"
            value={member.email}
            onChange={(e) =>
              update(i, 'email', e.target.value)
            }
          />
          <input
            className="input-base"
            placeholder="Cargo"
            value={member.role}
            onChange={(e) =>
              update(i, 'role', e.target.value)
            }
          />
        </div>
      ))}

      <button onClick={addMember} className="text-sm underline">
        + Adicionar pessoa
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
