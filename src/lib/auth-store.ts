import { create } from 'zustand';

export type UserRole = 'owner' | 'dispatcher' | 'driver';

interface AuthState {
  userId: string | null;
  email: string | null;
  fullName: string | null;
  roles: UserRole[];
  isLoading: boolean;
  setAuth: (data: { userId: string; email: string; fullName: string; roles: UserRole[] }) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  isOwner: () => boolean;
  isAdmin: () => boolean;
  isDriver: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  email: null,
  fullName: null,
  roles: [],
  isLoading: true,
  setAuth: (data) => set({ ...data, isLoading: false }),
  clearAuth: () => set({ userId: null, email: null, fullName: null, roles: [], isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  isOwner: () => get().roles.includes('owner'),
  isAdmin: () => get().roles.includes('owner') || get().roles.includes('dispatcher'),
  isDriver: () => get().roles.includes('driver'),
}));
