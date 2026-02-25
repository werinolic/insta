import { create } from 'zustand';
import type { SafeUser } from '@repo/shared';

interface AuthState {
  accessToken: string | null;
  user: SafeUser | null;
  setAuth: (token: string, user: SafeUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}));

interface UIState {
  notificationCount: number;
  setNotificationCount: (n: number) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  notificationCount: 0,
  setNotificationCount: (notificationCount) => set({ notificationCount }),
}));
