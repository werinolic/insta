import { create } from 'zustand';
import type { SafeUser } from '@repo/shared';
import { secureSet, secureDelete } from './secure-store';

interface AuthState {
  accessToken: string | null;
  user: SafeUser | null;
  setAuth: (token: string, user: SafeUser, sessionId?: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user, sessionId) => {
    set({ accessToken, user });
    // Persist sessionId to encrypted disk store for cold restarts
    if (sessionId) {
      secureSet('sessionId', sessionId).catch(() => {});
    }
  },
  clearAuth: () => {
    set({ accessToken: null, user: null });
    secureDelete('sessionId').catch(() => {});
  },
}));

interface UIState {
  notificationCount: number;
  setNotificationCount: (n: number) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  notificationCount: 0,
  setNotificationCount: (notificationCount) => set({ notificationCount }),
}));
