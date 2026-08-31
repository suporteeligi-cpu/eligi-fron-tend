// src/features/settings/lib/geocode.ts
// @eligi:geocode-photon
//
// Busca de endereco por Photon (Komoot), sobre dados do OpenStreetMap.
//
// Por que nao Nominatim: a politica de uso do nominatim.openstreetmap.org diz,
// com todas as letras, que busca com autocompletar nao e suportada e nao deve
// ser implementada no cliente usando a API. Ela tambem limita a 1 requisicao
// por segundo e trata requisicoes periodicas de aplicativos como uso em massa,
// desencorajado. Photon existe justamente para search-as-you-type.
//
// LIMITE CONHECIDO: a instancia publica photon.komoot.io admite uso
// "razoavel"; uso extensivo pode ser limitado ou bloqueado, e nao ha garantia
// de disponibilidade. Para onboarding -- uma vez por lojista -- serve. Se um
// dia virar busca de alto volume, o caminho e hospedar a propria instancia ou
// contratar um provedor.

const PHOTON = 'https://photon.komoot.io/api/';
// Caixa do Brasil: evita sugerir rua homonima em Portugal.
const BBOX_BR = '-74.0,-34.0,-34.0,6.0';

export interface AddressHit {
  /** Linha pronta para exibir na lista de sugestoes. */
  label: string;
  street: string;
  houseNumber: string;
  district: string;
  city: string;
  state: string;
  postcode: string;
  lat: number;
  lng: number;
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, unknown>;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Siglas de UF a partir do nome do estado que o Photon devolve por extenso. */
const UF: Record<string, string> = {
  acre: 'AC', alagoas: 'AL', amapa: 'AP', amazonas: 'AM', bahia: 'BA',
  ceara: 'CE', 'distrito federal': 'DF', 'espirito santo': 'ES', goias: 'GO',
  maranhao: 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS',
  'minas gerais': 'MG', para: 'PA', paraiba: 'PB', parana: 'PR',
  pernambuco: 'PE', piaui: 'PI', 'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN', 'rio grande do sul': 'RS', rondonia: 'RO',
  roraima: 'RR', 'santa catarina': 'SC', 'sao paulo': 'SP', sergipe: 'SE',
  tocantins: 'TO',
};

function toUf(state: string): string {
  if (!state) return '';
  if (state.length === 2) return state.toUpperCase();
  const key = state
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return UF[key] ?? '';
}

function toHit(f: PhotonFeature): AddressHit | null {
  const c = f.geometry?.coordinates;
  if (!c || c.length < 2) return null;
  const p = f.properties ?? {};

  const street = str(p.street) || str(p.name);
  const houseNumber = str(p.housenumber);
  const district = str(p.district) || str(p.suburb);
  const city = str(p.city) || str(p.town) || str(p.village) || str(p.county);
  const state = toUf(str(p.state));
  const postcode = str(p.postcode);

  const linha1 = [street, houseNumber].filter(Boolean).join(', ');
  const linha2 = [district, city, state].filter(Boolean).join(' - ');
  const label = [linha1 || str(p.name), linha2].filter(Boolean).join(' | ');
  if (!label.trim()) return null;

  return {
    label,
    street,
    houseNumber,
    district,
    city,
    state,
    postcode,
    lat: c[1],
    lng: c[0],
  };
}

/**
 * Busca enderecos. `signal` permite cancelar a requisicao anterior quando o
 * usuario continua digitando -- sem isso, uma resposta lenta pode chegar
 * depois de uma rapida e sobrescrever a lista com resultado velho.
 */
export async function searchAddress(
  query: string,
  signal?: AbortSignal,
): Promise<AddressHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  // @eligi:photon-lang-fix
  // O Photon aceita apenas default, en, de e fr. Com lang=pt ele devolve 400 e
  // nenhuma sugestao aparecia. 'default' retorna o nome LOCAL do lugar, que no
  // Brasil ja e portugues.
  const base = PHOTON + '?q=' + encodeURIComponent(q) + '&lang=default&limit=6';

  let res = await fetch(base + '&bbox=' + BBOX_BR, {
    signal,
    headers: { Accept: 'application/json' },
  });

  // Se o servidor recusou algum parametro, tenta sem a caixa do Brasil antes
  // de desistir: perder o recorte geografico e melhor que perder a busca.
  if (res.status === 400) {
    res = await fetch(base, { signal, headers: { Accept: 'application/json' } });
  }

  if (!res.ok) throw new Error('photon_' + res.status);

  const data = (await res.json()) as { features?: PhotonFeature[] };
  const hits: AddressHit[] = [];
  for (const f of data.features ?? []) {
    const h = toHit(f);
    // Sem cidade a sugestao nao ajuda a preencher o formulario.
    if (h && h.city) hits.push(h);
  }
  return hits;
}

/** Uma consulta so, para posicionar o pino depois que o CEP preencheu tudo. */
export async function geocodeOnce(address: string): Promise<AddressHit | null> {
  const hits = await searchAddress(address);
  return hits[0] ?? null;
}
