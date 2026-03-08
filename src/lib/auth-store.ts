import { create } from 'zustand';

export type UserRole = 'platform_owner' | 'owner' | 'dispatcher' | 'driver';

interface AuthState {
  userId: string | null;
  email: string | null;
  fullName: string | null;
  roles: UserRole[];
  companyId: string | null;
  isLoading: boolean;
  setAuth: (data: { userId: string; email: string; fullName: string; roles: UserRole[]; companyId?: string | null }) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  isPlatformOwner: () => boolean;
  isOwner: () => boolean;
  isAdmin: () => boolean;
  isDriver: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  email: null,
  fullName: null,
  roles: [],
  companyId: null,
  isLoading: true,
  setAuth: (data) => set({ ...data, companyId: data.companyId ?? null, isLoading: false }),
  clearAuth: () => set({ userId: null, email: null, fullName: null, roles: [], companyId: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  isPlatformOwner: () => get().roles.includes('platform_owner'),
  isOwner: () => get().roles.includes('owner') || get().roles.includes('platform_owner'),
  isAdmin: () => get().roles.includes('owner') || get().roles.includes('dispatcher') || get().roles.includes('platform_owner'),
  isDriver: () => get().roles.includes('driver'),
}));
