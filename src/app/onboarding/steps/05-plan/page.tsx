'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Zap, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

import { useOnboardingStore } from '../../store';
import { api } from '@/lib/api';
import LegalModal from '@/shared/legal/LegalModal';


type Plan = 'trial' | 'subscribe';

export default function PlanStep() {
  const router = useRouter();
  const setData = useOnboardingStore((s) => s.setData);
  const journeyType = useOnboardingStore((s) => s.journeyType);

  const isBusiness = journeyType === 'BUSINESS';
  const planName = isBusiness ? 'Estabelecimento' : 'Autônomo';
  const price = isBusiness ? '99,90' : '59,90';

  const [plan, setPlan] = useState<Plan>('trial');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legal, setLegal] = useState<null | 'termos' | 'privacidade' | 'termos-plano'>(null);
  

  async function finish() {
    if (loading || !accepted) return;
    try {
      setLoading(true);
      setError(null);
      await api.post('/onboarding/finish', { termsAccepted: true, plan });
      setData({ plan });
      // TODO(asaas): se plan === 'subscribe', abrir o pagamento do plano (Asaas)
      // em vez de ir direto pro dashboard. Por ora ambos concluem o onboarding.
      router.replace('/dashboard');
    } catch {
      setError('Não foi possível concluir agora. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="ob-eyebrow ob-anim">Passo 5 de 5</p>
      <h1 className="ob-title ob-anim" style={{ animationDelay: '.05s' }}>Como você quer começar?</h1>
      <p className="ob-subtitle ob-anim" style={{ animationDelay: '.1s' }}>
        Plano {planName} · você pode mudar depois.
      </p>

      <div className="ob-plans ob-anim" style={{ animationDelay: '.15s' }}>
        <button
          type="button"
          onClick={() => setPlan('trial')}
          className={plan === 'trial' ? 'ob-plan ob-plan--active' : 'ob-plan'}
        >
          <span className="ob-plan-badge">Recomendado</span>
          <div className="ob-plan-head">
            <Gift size={20} color="#dc2626" />
            <span className="ob-plan-name">7 dias grátis</span>
          </div>
          <div className="ob-plan-price" style={{ color: '#dc2626' }}>Sem cartão agora</div>
          <div className="ob-plan-desc">Explore tudo sem pagar nada. No 8º dia você decide.</div>
        </button>

        <button
          type="button"
          onClick={() => setPlan('subscribe')}
          className={plan === 'subscribe' ? 'ob-plan ob-plan--active' : 'ob-plan'}
        >
          <div className="ob-plan-head">
            <Zap size={20} color={plan === 'subscribe' ? '#dc2626' : '#9ca3af'} />
            <span className="ob-plan-name">Assinar agora</span>
          </div>
          <div className="ob-plan-price">
            R$ {price}<span className="ob-plan-price-unit">/mês</span>
          </div>
          <div className="ob-plan-desc">Ativa na hora, sem prazo. Para quem já está convencido.</div>
        </button>
      </div>

      <label className="ob-terms ob-anim" style={{ animationDelay: '.2s' }}>
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          style={{ marginTop: 2, accentColor: '#dc2626' }}
        />
        <span>
          Li e aceito os{' '}
          <button type="button" onClick={() => setLegal('termos')} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer' }}>Termos de Uso</button>,{' '}
          a{' '}
          <button type="button" onClick={() => setLegal('privacidade')} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer' }}>Política de Privacidade</button>{' '}
          e os{' '}
          <button type="button" onClick={() => setLegal('termos-plano')} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer' }}>Termos de Planos e Assinatura</button>.
        </span>
      </label>

      {error && <p className="ob-error" style={{ marginBottom: 12 }}>{error}</p>}

      <button
        onClick={finish}
        disabled={!accepted || loading}
        className="ob-btn-next ob-btn-next--block ob-anim"
        style={{ animationDelay: '.25s' }}
      >
        {loading
          ? 'Concluindo...'
          : plan === 'trial'
          ? (<>Começar teste grátis <ArrowRight size={17} /></>)
          : (<>Ir para o pagamento <ArrowRight size={17} /></>)}
      </button>

      <p className="ob-secure ob-anim" style={{ animationDelay: '.3s' }}>
        <Lock size={14} /> Pagamento seguro via Asaas · cancele quando quiser
      </p>

      <div className="ob-nav" style={{ justifyContent: 'flex-start' }}>
        <button
          type="button"
          onClick={() => router.push('/onboarding/steps/04-services')}
          className="ob-btn-back"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>
      {legal && <LegalModal kind={legal} onClose={() => setLegal(null)} />}
      {legal && <LegalModal kind={legal} onClose={() => setLegal(null)} />}
    </div>
  );
}
