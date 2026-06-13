'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Scissors,
  Sparkles,
  Gem,
  Eye,
  Hand,
  Feather,
  Droplet,
  Palette,
  User,
  Users,
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { identitySchema, SEGMENTS, type Segment } from './schema';
import { useOnboardingStore } from '../../store';
import { api } from '@/lib/api';

type JourneyType = 'BUSINESS' | 'SOLO';

const SEGMENT_META: { value: Segment; label: string; Icon: LucideIcon }[] = [
  { value: 'BARBEARIA', label: 'Barbearia', Icon: Scissors },
  { value: 'SALAO_BELEZA', label: 'Salão de Beleza', Icon: Sparkles },
  { value: 'CLINICA_ESTETICA', label: 'Clínica de Estética', Icon: Gem },
  { value: 'SOBRANCELHAS_CILIOS', label: 'Sobrancelhas e Cílios', Icon: Eye },
  { value: 'ESMALTERIA', label: 'Esmalteria', Icon: Hand },
  { value: 'CLINICA_DEPILACAO', label: 'Clínica de Depilação', Icon: Feather },
  { value: 'SPA_CAPILAR', label: 'Spa Capilar', Icon: Droplet },
  { value: 'STUDIO', label: 'Studio', Icon: Palette },
];

const TYPE_OPTIONS: {
  value: JourneyType;
  title: string;
  desc: string;
  Icon: LucideIcon;
}[] = [
  { value: 'SOLO', title: 'Solo', desc: 'Só eu atendo', Icon: User },
  { value: 'BUSINESS', title: 'Estabelecimento', desc: 'Tenho equipe', Icon: Users },
];

// garante que SEGMENTS é usado mesmo se a lista mudar (evita import morto)
const TOTAL_SEGMENTS = SEGMENTS.length;

export default function IdentityStep() {
  const router = useRouter();
  const setData = useOnboardingStore((s) => s.setData);

  const [journeyType, setJourneyType] = useState<JourneyType | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [segment, setSegment] = useState<Segment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (loading) return;

    const parsed = identitySchema.safeParse({ journeyType, displayName, segment });
    if (!parsed.success) {
      setError('Preencha o tipo, o nome e o segmento para continuar.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.post('/onboarding/identity', parsed.data);
      setData(parsed.data);
      router.push('/onboarding/steps/02-location');
    } catch {
      setError('Não foi possível salvar agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-7">
      <div className="space-y-1">
        <p className="text-xs text-neutral-500">Passo 1 de 5</p>
        <h1 className="text-xl font-semibold">Sobre o seu negócio</h1>
      </div>

      {/* Tipo de operação */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Tipo de operação</label>
        <div className="grid grid-cols-2 gap-3">
          {TYPE_OPTIONS.map(({ value, title, desc, Icon }) => {
            const active = journeyType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setJourneyType(value)}
                className={`text-left rounded-xl border p-4 transition ${
                  active ? 'border-red-500 bg-red-500/5' : 'border-neutral-200 hover:border-red-300'
                }`}
              >
                <Icon size={20} className={active ? 'text-red-600' : 'text-neutral-500'} />
                <div className="mt-2 text-sm font-medium">{title}</div>
                <div className="text-xs text-neutral-500">{desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nome do estabelecimento */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Nome do estabelecimento</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="input-base w-full"
          placeholder="Ex: Barbearia do Eli"
        />
      </div>

      {/* Segmento */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Segmento <span className="text-neutral-400">({TOTAL_SEGMENTS} opções)</span>
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {SEGMENT_META.map(({ value, label, Icon }) => {
            const active = segment === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSegment(value)}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
                  active ? 'border-red-500 bg-red-500/5' : 'border-neutral-200 hover:border-red-300'
                }`}
              >
                <Icon size={20} className={`shrink-0 ${active ? 'text-red-600' : 'text-neutral-500'}`} />
                <span className="text-sm leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end pt-2">
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
