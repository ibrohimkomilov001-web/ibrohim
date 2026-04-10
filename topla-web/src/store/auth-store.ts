import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { userAuthApi, isUserAuthenticated, setUserTokens, removeUserTokens } from '@/lib/api/user-auth';
import type { UserProfile } from '@/lib/api/user-auth';

interface AuthStore {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (phone: string, code: string) => Promise<{ success: boolean; isNewUser?: boolean; error?: string }>;
  loginWithGoogle: (googleAccessToken: string) => Promise<{ success: boolean; isNewUser?: boolean; error?: string }>;
  loginWithPasskey: () => Promise<{ success: boolean; isNewUser?: boolean; error?: string }>;
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
          return { success: true, isNewUser: data.isNewUser };
        } catch (error: any) {
          set({ isLoading: false });
          return { success: false, error: error.message || 'Login failed' };
        }
      },

      loginWithGoogle: async (googleAccessToken) => {
        try {
          set({ isLoading: true });
          const data = await userAuthApi.loginWithGoogle(googleAccessToken);
          setUserTokens(data.accessToken, data.refreshToken);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true, isNewUser: data.isNewUser };
        } catch (error: any) {
          set({ isLoading: false });
          return { success: false, error: error.message || 'Google login failed' };
        }
      },

      loginWithPasskey: async () => {
        try {
          set({ isLoading: true });
          const { startAuthentication } = await import('@simplewebauthn/browser');
          const { options, sessionId } = await userAuthApi.passkeyLoginBegin();
          const credential = await startAuthentication({ optionsJSON: options });
          const data = await userAuthApi.passkeyLoginVerify(sessionId, credential);
          setUserTokens(data.accessToken, data.refreshToken);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true, isNewUser: data.isNewUser };
        } catch (error: any) {
          set({ isLoading: false });
          if (error.name === 'NotAllowedError') {
            return { success: false, error: 'Passkey bekor qilindi' };
          }
          return { success: false, error: error.message || 'Passkey login failed' };
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
