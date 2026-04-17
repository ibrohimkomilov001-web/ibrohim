"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi, type VendorProfile } from "@/lib/api/auth";
import { isVendorAuthenticated, removeToken } from "@/lib/api/client";

interface AuthState {
  user: VendorProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVendor: boolean;
  shopStatus: string | null;
  contractStatus: string | null;
}

interface AuthContextType extends AuthState {
  login: (phone: string, password: string) => Promise<void>;
  loginWithGoogle: (googleAccessToken: string) => Promise<void>;
  loginWithOtp: (phone: string, code: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isPending: boolean;
  isContractSigned: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isVendor: false,
    shopStatus: null,
    contractStatus: null,
  });

  const refreshProfile = useCallback(async () => {
    if (!isVendorAuthenticated()) {
      setState({ user: null, isLoading: false, isAuthenticated: false, isVendor: false, shopStatus: null, contractStatus: null });
      return;
    }

    try {
      const profile = await authApi.getProfile();
      setState({
        user: profile,
        isLoading: false,
        isAuthenticated: true,
        isVendor: profile.role === "vendor",
        shopStatus: profile.shop?.status || null,
        contractStatus: profile.shop?.contractStatus || null,
      });
    } catch (err: any) {
      const status = err?.status ?? 0;
      if (status === 401 || status === 403) {
        removeToken();
        setState({ user: null, isLoading: false, isAuthenticated: false, isVendor: false, shopStatus: null, contractStatus: null });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (phone: string, password: string) => {
    const response = await authApi.login({ phone, password });
    const fullName = response.user.fullName || "";
    const nameParts = fullName.trim().split(/\s+/);
    setState({
      user: {
        id: response.user.id,
        email: response.user.email,
        fullName: response.user.fullName,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        phone: response.user.phone,
        role: response.user.role,
        avatarUrl: response.user.avatarUrl,
        shop: response.shop,
      },
      isLoading: false,
      isAuthenticated: true,
      isVendor: response.user.role === "vendor",
      shopStatus: response.shop?.status || null,
      contractStatus: response.shop?.contractStatus || null,
    });
  };

  const loginWithGoogle = async (googleAccessToken: string) => {
    const response = await authApi.googleLogin({ googleAccessToken });
    const fullName = response.user.fullName || "";
    const nameParts = fullName.trim().split(/\s+/);
    setState({
      user: {
        id: response.user.id,
        email: response.user.email,
        fullName: response.user.fullName,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        phone: response.user.phone,
        role: response.user.role,
        avatarUrl: response.user.avatarUrl,
        shop: response.shop,
      },
      isLoading: false,
      isAuthenticated: true,
      isVendor: response.user.role === "vendor",
      shopStatus: response.shop?.status || null,
      contractStatus: response.shop?.contractStatus || null,
    });
  };

  const loginWithOtp = async (phone: string, code: string) => {
    const response = await authApi.loginOtp({ phone, code });
    const fullName = response.user.fullName || "";
    const nameParts = fullName.trim().split(/\s+/);
    setState({
      user: {
        id: response.user.id,
        email: response.user.email,
        fullName: response.user.fullName,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        phone: response.user.phone,
        role: response.user.role,
        avatarUrl: response.user.avatarUrl,
        shop: response.shop,
      },
      isLoading: false,
      isAuthenticated: true,
      isVendor: response.user.role === "vendor",
      shopStatus: response.shop?.status || null,
      contractStatus: response.shop?.contractStatus || null,
    });
  };

  const logout = () => {
    authApi.logout();
    setState({ user: null, isLoading: false, isAuthenticated: false, isVendor: false, shopStatus: null, contractStatus: null });
  };

  const isPending = state.shopStatus === "pending";
  const isContractSigned = state.contractStatus === "signed";

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, loginWithOtp, logout, refreshProfile, isPending, isContractSigned }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export default useAuth;
