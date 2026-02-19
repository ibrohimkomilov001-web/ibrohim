"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi, type VendorProfile } from "@/lib/api/auth";
import { getToken, removeToken } from "@/lib/api/client";

interface AuthState {
  user: VendorProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVendor: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isVendor: false,
  });

  const refreshProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ user: null, isLoading: false, isAuthenticated: false, isVendor: false });
      return;
    }

    try {
      const profile = await authApi.getProfile();
      setState({
        user: profile,
        isLoading: false,
        isAuthenticated: true,
        isVendor: profile.role === "vendor",
      });
    } catch {
      removeToken();
      setState({ user: null, isLoading: false, isAuthenticated: false, isVendor: false });
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
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
    });
  };

  const logout = () => {
    authApi.logout();
    setState({ user: null, isLoading: false, isAuthenticated: false, isVendor: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshProfile }}>
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
