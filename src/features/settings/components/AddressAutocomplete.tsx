'use client';
// src/features/settings/components/AddressAutocomplete.tsx
// @eligi:address-autocomplete
//
// Campo de busca de endereco com sugestoes. Escolher uma sugestao devolve o
// endereco estruturado E a coordenada de uma vez -- e o unico caminho: nao
// existe "aceitar o que foi digitado". Digitar sem escolher nunca produziu
// coordenada, e era assim que o cadastro terminava sem lugar nenhum.
//
// Espera 350ms depois da ultima tecla e exige 3 caracteres. Cada busca cancela
// a anterior, senao uma resposta lenta chega depois de uma rapida e sobrescreve
// a lista com resultado velho.

import { useEffect, useRef, useState } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';
import { searchAddress, type AddressHit } from '../lib/geocode';

const DEBOUNCE_MS = 350;
const MIN_CHARS = 3;

interface Props {
  onPick: (hit: AddressHit) => void;
  placeholder?: string;
  /** true dentro do onboarding, que tem fundo escuro. */
  dark?: boolean;
  label?: string;
  /** Quando informado, o input passa a ser controlado por quem chama --
   *  e assim o autocomplete VIRA o campo de endereco, em vez de ser um
   *  segundo campo ao lado dele. */
  value?: string;
  onTextChange?: (v: string) => void;
}

export default function AddressAutocomplete({
  onPick,
  placeholder = 'Digite rua, bairro ou nome do lugar',
  dark = false,
  label,
  value,
  onTextChange,
}: Props) {
  const [inner, setInner] = useState('');
  const controlled = value !== undefined;
  const query = controlled ? value : inner;
  const setQuery = (v: string) => {
    if (controlled) onTextChange?.(v);
    else setInner(v);
  };
  const [hits, setHits] = useState<AddressHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const onPickRef = useRef(onPick);
  useEffect(() => { onPickRef.current = onPick; });

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_CHARS) { setHits([]); setErr(null); setLoading(false); return; }

    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchAddress(q, ctrl.signal);
        setHits(r);
        setErr(r.length === 0 ? 'Nada encontrado. Tente sem o numero.' : null);
        setOpen(true);
      } catch (e) {
        if ((e as Error)?.name !== 'AbortError') {
          setHits([]);
          setErr('Busca indisponivel agora. Ajuste o pino no mapa.');
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => { clearTimeout(t); ctrl.abort(); };
  }, [query]);

  // Clique fora fecha a lista.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function choose(h: AddressHit) {
    onPickRef.current(h);
    setQuery(h.label.replace(' | ', ', '));
    setHits([]);
    setOpen(false);
    setTouched(true);
  }

  const muted = dark ? 'rgba(255,255,255,0.5)' : '#71717a';

  return (
    <div ref={boxRef} style={{ position: 'relative', zIndex: open ? 2000 : undefined }}>
      {label && (
        <div style={{ fontSize: 12.5, fontWeight: 600, color: muted, marginBottom: 6 }}>
          {label}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: muted }}
        />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setTouched(true); }}
          onFocus={() => { if (hits.length) setOpen(true); }}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            width: '100%',
            minHeight: 48,
            padding: '0 38px 0 36px',
            borderRadius: 12,
            fontSize: 16, // 16px evita o zoom automatico do iOS ao focar
            border: dark ? '1px solid rgba(255,255,255,0.14)' : '1px solid #e7e7ec',
            background: dark ? 'rgba(255,255,255,0.05)' : '#fff',
            color: dark ? '#f4f4f7' : '#0c0c12',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
        {loading && (
          <Loader2
            size={16}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              color: muted, animation: 'eligi-spin 1s linear infinite',
            }}
          />
        )}
      </div>

      {open && hits.length > 0 && (
        <ul
          style={{
            listStyle: 'none', margin: '6px 0 0', padding: 4, position: 'absolute',
            left: 0, right: 0, maxHeight: 264, overflowY: 'auto',
            // O Leaflet monta camadas internas ate a casa das centenas.
            // Abaixo disso o mapa cobre as sugestoes.
            zIndex: 2000,
            borderRadius: 12,
            border: dark ? '1px solid rgba(255,255,255,0.14)' : '1px solid #e7e7ec',
            background: dark ? '#16161c' : '#fff',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
          }}
        >
          {hits.map((h, i) => {
            const [linha1, linha2] = h.label.split(' | ');
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => choose(h)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '11px 12px', minHeight: 56, border: 'none', borderRadius: 9,
                    background: 'transparent', cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <MapPin size={15} style={{ color: muted, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{
                      display: 'block', fontSize: 14.5, fontWeight: 600,
                      color: dark ? '#f4f4f7' : '#0c0c12',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {linha1}
                    </span>
                    {linha2 && (
                      <span style={{
                        display: 'block', fontSize: 12.5, color: muted, marginTop: 1,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {linha2}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {err && touched && !loading && (
        <p style={{ fontSize: 12, color: muted, marginTop: 6 }}>{err}</p>
      )}
    </div>
  );
}
