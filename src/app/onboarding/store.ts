import { create } from 'zustand';

type BusinessHours = {
  weekday: number;
  startTime: string;
  endTime: string;
};

type Service = {
  name: string;
  duration: number;
  price?: number;
};

interface OnboardingData {
  // 01 — identidade
  journeyType?: 'BUSINESS' | 'SOLO';
  displayName?: string;
  segment?: string; // valor canônico (ver SEGMENTS no backend)

  // 02 — localização
  cep?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
  timezone?: string;

  // 03 — horário
  hours?: BusinessHours[];

  // 04 — serviços
  services?: Service[];

  // 05 — plano
  plan?: 'trial' | 'subscribe';
}

interface OnboardingStore extends OnboardingData {
  setData: (data: Partial<OnboardingData>) => void;
  reset: () => void;
}

const EMPTY: OnboardingData = {
  journeyType: undefined,
  displayName: undefined,
  segment: undefined,
  cep: undefined,
  address: undefined,
  city: undefined,
  state: undefined,
  country: undefined,
  lat: undefined,
  lng: undefined,
  timezone: undefined,
  hours: undefined,
  services: undefined,
  plan: undefined,
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  ...EMPTY,
  setData: (data) => set((state) => ({ ...state, ...data })),
  // merge com todos os campos undefined — limpa os dados sem apagar as actions
  reset: () => set({ ...EMPTY }),
}));
