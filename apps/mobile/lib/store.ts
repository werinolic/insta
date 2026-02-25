import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { SafeUser } from '@repo/shared';

export type { SafeUser };

interface AuthState {
  accessToken: string | null;
  sessionId: string | null;
  user: SafeUser | null;
  setAuth: (token: string, sessionId: string, user: SafeUser) => void;
  clearAuth: () => void;
  setUser: (user: SafeUser) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  sessionId: null,
  user: null,
  setAuth: (accessToken, sessionId, user) => {
    SecureStore.setItemAsync('accessToken', accessToken);
    SecureStore.setItemAsync('sessionId', sessionId);
    set({ accessToken, sessionId, user });
  },
  clearAuth: () => {
    SecureStore.deleteItemAsync('accessToken');
    SecureStore.deleteItemAsync('sessionId');
    set({ accessToken: null, sessionId: null, user: null });
  },
  setUser: (user) => set({ user }),
}));

interface UIState {
  notificationCount: number;
  setNotificationCount: (n: number) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  notificationCount: 0,
  setNotificationCount: (n) => set({ notificationCount: n }),
}));
