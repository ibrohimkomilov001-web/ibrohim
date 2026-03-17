import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { userAuthApi, isUserAuthenticated, setUserTokens, removeUserTokens } from '@/lib/api/user-auth';
import type { UserProfile } from '@/lib/api/user-auth';

interface AuthStore {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (phone, code) => {
        try {
          set({ isLoading: true });
          const data = await userAuthApi.verifyOtp(phone, code);
          setUserTokens(data.accessToken, data.refreshToken);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (error: any) {
          set({ isLoading: false });
          return { success: false, error: error.message || 'Login failed' };
        }
      },

      logout: async () => {
        try {
          await userAuthApi.logout();
        } catch { /* ignore */ }
        removeUserTokens();
        set({ user: null, isAuthenticated: false });
      },

      fetchProfile: async () => {
        try {
          const user = await userAuthApi.getMe();
          set({ user, isAuthenticated: true });
        } catch {
          removeUserTokens();
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      checkAuth: async () => {
        if (!isUserAuthenticated()) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        try {
          set({ isLoading: true });
          const user = await userAuthApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          removeUserTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'topla-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
