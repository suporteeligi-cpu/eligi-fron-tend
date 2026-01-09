import { create } from 'zustand';

type BusinessHours = {
  weekday: number;
  startTime: string;
  endTime: string;
};

type TeamMember = {
  name: string;
  role?: string;
};

type Service = {
  name: string;
  price?: number;
  duration?: number;
};

interface OnboardingStore {
  // step 01
  journeyType?: 'BUSINESS' | 'SOLO' | 'PERSONAL' | 'AFFILIATE';

  // step 02
  displayName?: string;
  businessType?: string;

  // step 03
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;

  // step 04
  hours?: BusinessHours[];

  // futuros
  team?: TeamMember[];
  services?: Service[];

  // actions
  setData: (data: Partial<OnboardingStore>) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  setData: (data) => set((state) => ({ ...state, ...data })),
  reset: () => set({})
}));
