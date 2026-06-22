'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Scissors, Sparkles, Gem, Eye, Hand, Feather, Droplet, Palette, User, Users, ArrowRight, LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { identitySchema, SEGMENTS, type Segment } from './schema';
import { useOnboardingStore } from '../../store';
import { api } from '@/lib/api';
import { logoutRequest } from '@/lib/auth.api';
import ConfirmDialog from '@/shared/components/ConfirmDialog';

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

const TYPE_OPTIONS: { value: JourneyType; title: string; desc: string; Icon: LucideIcon }[] = [
  { value: 'SOLO', title: 'Solo', desc: 'Só eu atendo', Icon: User },
  { value: 'BUSINESS', title: 'Estabelecimento', desc: 'Tenho equipe', Icon: Users },
];

const TOTAL_SEGMENTS = SEGMENTS.length;

export default function IdentityStep() {
  const router = useRouter();
  const setData = useOnboardingStore((s) => s.setData);

  const [journeyType, setJourneyType] = useState<JourneyType | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [segment, setSegment] = useState<Segment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);

  async function handleLogout() {
    try { await logoutRequest(); } catch { /* segue pro login mesmo se falhar */ }
    router.replace('/login');
  }

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
    <div>
      <p className="ob-eyebrow ob-anim">Passo 1 de 5</p>
      <h1 className="ob-title ob-anim" style={{ animationDelay: '.05s' }}>Sobre o seu negócio</h1>
      <p className="ob-subtitle ob-anim" style={{ animationDelay: '.1s' }}>
        Vamos começar com o essencial.
      </p>

      <div className="ob-field ob-anim" style={{ animationDelay: '.15s' }}>
        <label className="ob-label">Tipo de operação</label>
        <div className="ob-grid2">
          {TYPE_OPTIONS.map(({ value, title, desc, Icon }) => {
            const active = journeyType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setJourneyType(value)}
                className={active ? 'ob-optcard ob-optcard--active' : 'ob-optcard'}
              >
                <Icon size={20} color={active ? '#dc2626' : '#737373'} />
                <div className="ob-optcard-title">{title}</div>
                <div className="ob-optcard-desc">{desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="ob-field ob-anim" style={{ animationDelay: '.2s' }}>
        <label className="ob-label">Nome do estabelecimento</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="input-base"
          style={{ width: '100%' }}
          placeholder="Ex: Salão da Ana"
        />
      </div>

      <div className="ob-field ob-anim" style={{ animationDelay: '.25s' }}>
        <label className="ob-label">
          Segmento <span className="ob-label-hint">({TOTAL_SEGMENTS} opções)</span>
        </label>
        <div className="ob-grid2">
          {SEGMENT_META.map(({ value, label, Icon }) => {
            const active = segment === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSegment(value)}
                className={active ? 'ob-segcard ob-segcard--active' : 'ob-segcard'}
              >
                <Icon size={20} color={active ? '#dc2626' : '#737373'} style={{ flexShrink: 0 }} />
                <span className="ob-segcard-label">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="ob-error">{error}</p>}

      <div className="ob-actions ob-anim" style={{ animationDelay: '.3s' }}>
        <button onClick={handleContinue} disabled={loading} className="ob-btn-next">
          {loading ? 'Salvando...' : (<>Continuar <ArrowRight size={16} /></>)}
        </button>
      </div>

      <div className="ob-anim" style={{ display: 'flex', justifyContent: 'center', marginTop: 16, animationDelay: '.35s' }}>
        <button
          type="button"
          onClick={() => setConfirmExit(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12.5, cursor: 'pointer', padding: 6 }}
        >
          <LogOut size={13} /> Sair da conta
        </button>
      </div>

      <ConfirmDialog
        open={confirmExit}
        title="Sair da conta?"
        message="Seu progresso fica salvo — você volta de onde parou no próximo login."
        confirmLabel="Sair"
        cancelLabel="Continuar aqui"
        onConfirm={handleLogout}
        onCancel={() => setConfirmExit(false)}
      />
    </div>
  );
}
