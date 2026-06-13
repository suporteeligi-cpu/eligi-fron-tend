'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

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

export default function LocationStep() {
  const router = useRouter();
  const setData = useOnboardingStore((s) => s.setData);

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
      setError('Busque o CEP para preencher cidade e estado.');
      return;
    }

    const address = [logradouro, numero].filter(Boolean).join(', ');
    const body = {
      cep: cep || undefined,
      address: address || undefined,
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
    <div className="space-y-6">
      <style>{`@keyframes eligi-spin { to { transform: rotate(360deg); } }`}</style>

      <div className="space-y-1">
        <p className="text-xs text-neutral-500">Passo 2 de 5</p>
        <h1 className="text-xl font-semibold">Onde fica seu negócio?</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-2">
          <label className="block text-sm font-medium">CEP</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              onBlur={(e) => buscarCep(e.target.value)}
              className="input-base w-full"
              placeholder="00000-000"
            />
            {loadingCep && (
              <Loader2
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                style={{ animation: 'eligi-spin 1s linear infinite' }}
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Número</label>
          <input
            type="text"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className="input-base w-full"
            placeholder="123"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Endereço</label>
        <input
          type="text"
          value={logradouro}
          onChange={(e) => setLogradouro(e.target.value)}
          className="input-base w-full"
          placeholder="Rua / Avenida"
        />
      </div>

      {(city || uf) && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 size={16} />
          {city}
          {uf ? ` · ${uf}` : ''} — preenchido pelo CEP
        </div>
      )}

      <MapPicker
        lat={lat}
        lng={lng}
        address={addressForGeocode}
        onChange={(la, ln) => {
          setLat(la);
          setLng(ln);
        }}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={() => router.push('/onboarding/steps/01-identity')}
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
