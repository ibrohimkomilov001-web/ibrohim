import api, { setToken, removeToken } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  shopName: string;
  shopDescription?: string;
  shopPhone?: string;
  shopAddress?: string;
  category?: string;
  city?: string;
  address?: string;
  businessType?: string;
  fulfillmentType?: 'FBS' | 'DBS';
  inn?: string;
  bankName?: string;
  bankAccount?: string;
  mfo?: string;
  oked?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName?: string;
    phone: string;
    role: string;
    avatarUrl?: string;
    language?: string;
  };
  shop?: {
    id: string;
    name: string;
    status: string;
  };
}

export interface VendorProfile {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  role: string;
  avatarUrl?: string;
  shop?: {
    id: string;
    name: string;
    status: string;
  };
}

export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await api.post<AuthResponse>('/auth/vendor/login', data);
    if (response.accessToken) {
      setToken(response.accessToken);
    }
    return { token: response.accessToken, user: response.user, shop: response.shop };
  },

  register: async (data: RegisterRequest) => {
    const response = await api.post<AuthResponse>('/auth/vendor/register', data);
    if (response.accessToken) {
      setToken(response.accessToken);
    }
    return { token: response.accessToken, user: response.user, shop: response.shop };
  },

  logout: () => {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/vendor/login';
    }
  },

  getProfile: () => api.get<VendorProfile>('/vendor/profile'),
};

export default authApi;
