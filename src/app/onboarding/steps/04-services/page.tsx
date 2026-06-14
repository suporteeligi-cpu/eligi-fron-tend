'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Plus, X, Tag } from 'lucide-react';

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
    <div>
      <p className="ob-eyebrow ob-anim">Passo 4 de 5</p>
      <h1 className="ob-title ob-anim" style={{ animationDelay: '.05s' }}>Seus serviços</h1>
      <p className="ob-subtitle ob-anim" style={{ animationDelay: '.1s' }}>
        Toque numa sugestão ou adicione o seu.
      </p>

      <div className="ob-chips ob-anim" style={{ animationDelay: '.15s' }}>
        {suggestions.map((s) => (
          <button key={s} type="button" onClick={() => addSuggestion(s)} className="ob-chip">
            <Plus size={14} /> {s}
          </button>
        ))}
      </div>

      {services.length > 0 && (
        <p className="ob-section-label">ADICIONADOS ({services.length})</p>
      )}

      <div>
        {services.map((s, i) => (
          <div key={i} className="ob-svc-card ob-anim">
            <div className="ob-svc-icon">
              <Tag size={18} color="#dc2626" />
            </div>
            <input
              value={s.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Nome do serviço"
              className="ob-mini-input"
              style={{ flex: 1, minWidth: 0 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                min={5}
                step={5}
                value={s.duration}
                onChange={(e) => update(i, { duration: Number(e.target.value) })}
                className="ob-mini-input"
                style={{ width: 60 }}
              />
              <span style={{ fontSize: 12, color: '#9ca3af' }}>min</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>R$</span>
              <input
                type="number"
                min={0}
                step={1}
                value={s.price ?? ''}
                onChange={(e) =>
                  update(i, { price: e.target.value === '' ? undefined : Number(e.target.value) })
                }
                placeholder="0"
                className="ob-mini-input"
                style={{ width: 72 }}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="ob-svc-remove"
              aria-label="Remover"
            >
              <X size={16} />
            </button>
          </div>
        ))}

        <button type="button" onClick={addBlank} className="ob-add-btn">
          <Plus size={16} /> Adicionar serviço
        </button>
      </div>

      {error && <p className="ob-error">{error}</p>}

      <div className="ob-nav">
        <button
          type="button"
          onClick={() => router.push('/onboarding/steps/03-hours')}
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
