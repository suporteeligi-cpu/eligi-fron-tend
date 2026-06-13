'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, X } from 'lucide-react';

import { useOnboardingStore } from '../../store';
import { api } from '@/lib/api';

type Svc = { name: string; duration: number; price?: number };

const SUGGESTIONS: Record<string, string[]> = {
  BARBEARIA: ['Corte', 'Barba', 'Corte + Barba', 'Sobrancelha'],
  SALAO_BELEZA: ['Corte', 'Escova', 'Coloração', 'Hidratação'],
  CLINICA_ESTETICA: ['Limpeza de pele', 'Peeling', 'Massagem', 'Drenagem'],
  SOBRANCELHAS_CILIOS: ['Design de sobrancelha', 'Henna', 'Extensão de cílios', 'Lash lifting'],
  ESMALTERIA: ['Manicure', 'Pedicure', 'Esmaltação em gel', 'Alongamento'],
  CLINICA_DEPILACAO: ['Depilação a laser', 'Cera', 'Axilas', 'Pernas'],
  SPA_CAPILAR: ['Hidratação', 'Cronograma capilar', 'Reconstrução', 'Spa dos fios'],
  STUDIO: ['Atendimento', 'Sessão', 'Avaliação'],
};

export default function ServicesStep() {
  const router = useRouter();
  const setData = useOnboardingStore((s) => s.setData);
  const segment = useOnboardingStore((s) => s.segment);

  const [services, setServices] = useState<Svc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestions = (segment && SUGGESTIONS[segment]) || SUGGESTIONS.STUDIO;

  function addSuggestion(name: string) {
    if (services.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setServices((prev) => [...prev, { name, duration: 30 }]);
  }
  function addBlank() {
    setServices((prev) => [...prev, { name: '', duration: 30 }]);
  }
  function update(i: number, patch: Partial<Svc>) {
    setServices((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function remove(i: number) {
    setServices((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleContinue() {
    if (loading) return;
    const clean = services
      .map((s) => ({ name: s.name.trim(), duration: s.duration, price: s.price }))
      .filter((s) => s.name.length >= 2 && s.duration >= 5);

    if (clean.length === 0) {
      setError('Adicione pelo menos um serviço (nome + duração).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.post('/onboarding/services', { services: clean });
      setData({ services: clean });
      router.push('/onboarding/steps/05-plan');
    } catch {
      setError('Não foi possível salvar agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs text-neutral-500">Passo 4 de 5</p>
        <h1 className="text-xl font-semibold">Seus serviços</h1>
        <p className="text-sm text-neutral-500">Toque numa sugestão ou adicione o seu.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => addSuggestion(s)}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-sm hover:border-red-300"
          >
            <Plus size={14} /> {s}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {services.map((s, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl border border-neutral-200 p-2.5">
            <input
              value={s.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Nome do serviço"
              className="flex-1 min-w-0 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={5}
                step={5}
                value={s.duration}
                onChange={(e) => update(i, { duration: Number(e.target.value) })}
                className="w-16 rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
              />
              <span className="text-xs text-neutral-400">min</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-neutral-400">R$</span>
              <input
                type="number"
                min={0}
                step={1}
                value={s.price ?? ''}
                onChange={(e) =>
                  update(i, { price: e.target.value === '' ? undefined : Number(e.target.value) })
                }
                placeholder="0"
                className="w-20 rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-neutral-400 hover:text-red-500"
              aria-label="Remover"
            >
              <X size={16} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addBlank}
          className="inline-flex items-center gap-1.5 text-sm text-red-600"
        >
          <Plus size={16} /> Adicionar serviço
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={() => router.push('/onboarding/steps/03-hours')}
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
