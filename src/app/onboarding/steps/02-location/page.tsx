'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2, MapPin, Home, Bike } from 'lucide-react';

import MapPicker from '@/features/settings/components/MapPicker';
import { useOnboardingStore } from '../../store';
import { api } from '@/lib/api';

type ViaCep = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

type Mode = 'FIXED' | 'MOBILE';

export default function LocationStep() {
  const router = useRouter();
  const setData = useOnboardingStore((s) => s.setData);
  const journeyType = useOnboardingStore((s) => s.journeyType);

  // SOLO pode escolher; BUSINESS (ou journeyType ausente) sempre local fixo
  const canChooseMode = journeyType === 'SOLO';
  const [mode, setMode] = useState<Mode>('FIXED');

  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [loadingCep, setLoadingCep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMobile = canChooseMode && mode === 'MOBILE';

  async function buscarCep(raw: string) {
    const clean = raw.replace(/\D/g, '');
    if (clean.length !== 8) return;

    setLoadingCep(true);
    setError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = (await res.json()) as ViaCep;
      if (data.erro) {
        setError('CEP não encontrado.');
        return;
      }
      setLogradouro(data.logradouro || '');
      setCity(data.localidade || '');
      setUf(data.uf || '');
    } catch {
      setError('Falha ao buscar o CEP.');
    } finally {
      setLoadingCep(false);
    }
  }

  const addressForGeocode = [logradouro, numero, city, uf, 'Brasil']
    .filter(Boolean)
    .join(', ');

  async function handleContinue() {
    if (loading) return;
    if (!city || !uf) {
      setError(
        isMobile
          ? 'Informe a cidade e o estado da sua área de atuação.'
          : 'Busque o CEP para preencher cidade e estado.'
      );
      return;
    }

    // Modo a domicílio: só cidade/estado; sem endereço/CEP/geo
    const body = isMobile
      ? {
          serviceMode: 'MOBILE' as const,
          city,
          state: uf,
          country: 'BR',
        }
      : {
          serviceMode: 'FIXED' as const,
          cep: cep || undefined,
          address: [logradouro, numero].filter(Boolean).join(', ') || undefined,
          city,
          state: uf,
          country: 'BR',
          lat: lat ?? undefined,
          lng: lng ?? undefined,
        };

    try {
      setLoading(true);
      setError(null);
      await api.post('/onboarding/location', body);
      setData(body);
      router.push('/onboarding/steps/03-hours');
    } catch {
      setError('Não foi possível salvar agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <style>{`@keyframes eligi-spin { to { transform: rotate(360deg); } }`}</style>

      <p className="ob-eyebrow ob-anim">Passo 2 de 5</p>
      <h1 className="ob-title ob-anim" style={{ animationDelay: '.05s' }}>
        {isMobile ? 'Onde você atende?' : 'Onde fica seu negócio?'}
      </h1>
      <p className="ob-subtitle ob-anim" style={{ animationDelay: '.1s' }}>
        {isMobile
          ? 'Seus clientes verão a região que você cobre.'
          : 'Isso ajuda seus clientes a te encontrar.'}
      </p>

      {/* Toggle de modo — só pra autônomo (SOLO) */}
      {canChooseMode && (
        <div
          className="ob-anim"
          style={{ display: 'flex', gap: 10, marginBottom: 8, animationDelay: '.12s' }}
        >
          <ModeCard
            active={mode === 'FIXED'}
            icon={<Home size={18} />}
            title="Tenho um local fixo"
            desc="Atendo no meu endereço"
            onClick={() => {
              setMode('FIXED');
              setError(null);
            }}
          />
          <ModeCard
            active={mode === 'MOBILE'}
            icon={<Bike size={18} />}
            title="Atendo a domicílio"
            desc="Vou até o cliente"
            onClick={() => {
              setMode('MOBILE');
              setError(null);
            }}
          />
        </div>
      )}

      {isMobile ? (
        // ===== Modo a domicílio: só cidade + estado =====
        <div className="ob-field ob-anim" style={{ animationDelay: '.18s' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label className="ob-label">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input-base"
                style={{ width: '100%' }}
                placeholder="Ex.: São Paulo"
              />
            </div>
            <div style={{ width: 96 }}>
              <label className="ob-label">Estado</label>
              <input
                type="text"
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
                className="input-base"
                style={{ width: '100%', textTransform: 'uppercase' }}
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary, #71717a)', marginTop: 10 }}>
            Sem endereço fixo: seus clientes verão “Atendimento a domicílio · {city || 'sua cidade'}
            {uf ? `-${uf}` : ''}”.
          </p>
        </div>
      ) : (
        // ===== Modo local fixo: fluxo de CEP + mapa (igual ao de hoje) =====
        <>
          <div className="ob-field ob-anim" style={{ animationDelay: '.15s' }}>
            <label className="ob-label">CEP</label>
            <div className="ob-input-wrap">
              <MapPin size={16} className="ob-input-icon" />
              <input
                type="text"
                inputMode="numeric"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                onBlur={(e) => buscarCep(e.target.value)}
                className="input-base"
                style={{ width: '100%', paddingLeft: 34 }}
                placeholder="00000-000"
              />
              {loadingCep && (
                <Loader2
                  size={16}
                  className="ob-input-spin"
                  style={{ animation: 'eligi-spin 1s linear infinite' }}
                />
              )}
            </div>
          </div>

          <div className="ob-field ob-anim" style={{ animationDelay: '.2s' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 96 }}>
                <label className="ob-label">Número</label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="input-base"
                  style={{ width: '100%' }}
                  placeholder="123"
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="ob-label">Endereço</label>
                <input
                  type="text"
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className="input-base"
                  style={{ width: '100%' }}
                  placeholder="Rua / Avenida"
                />
              </div>
            </div>
          </div>

          {(city || uf) && (
            <div className="ob-hint-ok">
              <CheckCircle2 size={16} />
              {city}
              {uf ? ` · ${uf}` : ''} — preenchido pelo CEP
            </div>
          )}

          <div className="ob-anim" style={{ animationDelay: '.25s' }}>
            <MapPicker
              lat={lat}
              lng={lng}
              address={addressForGeocode}
              onChange={(la, ln) => {
                setLat(la);
                setLng(ln);
              }}
            />
          </div>
        </>
      )}

      {error && <p className="ob-error">{error}</p>}

      <div className="ob-nav ob-anim" style={{ animationDelay: '.3s' }}>
        <button
          type="button"
          onClick={() => router.push('/onboarding/steps/01-identity')}
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

function ModeCard({
  active,
  icon,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        textAlign: 'left',
        padding: '12px 14px',
        borderRadius: 12,
        border: active ? '1.5px solid var(--eligi-red, #dc2626)' : '1px solid rgba(0,0,0,0.1)',
        background: active ? 'rgba(220,38,38,0.04)' : '#fff',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: active ? 'var(--eligi-red, #dc2626)' : '#52525b',
          fontWeight: 600,
          fontSize: 13.5,
        }}
      >
        {icon}
        {title}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-secondary, #71717a)' }}>{desc}</span>
    </button>
  );
}
