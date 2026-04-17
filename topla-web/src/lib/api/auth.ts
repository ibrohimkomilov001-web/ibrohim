import api, { setToken, removeToken } from './client';

export interface LoginRequest {
  phone: string;
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

export interface SendOtpRequest {
  phone: string;
}

export interface SendOtpByEmailRequest {
  email: string;
}

export interface SendOtpResponse {
  success: boolean;
  data: {
    phone: string;
    channel: string;
  };
  message: string;
}

export interface SendOtpByEmailResponse {
  maskedPhone: string;
  phone: string;
}

export interface RegisterOtpRequest {
  phone: string;
  code: string;
  fullName: string;
  password: string;
  email?: string;
  shopName: string;
  shopDescription?: string;
  slug?: string;
  category?: string;
  categoryId?: string;
  city?: string;
  businessType: 'yatt' | 'mchj';
  inn: string;
  bankName?: string;
  bankAccount?: string;
  mfo?: string;
  termsAccepted: true;
}

export interface CheckAvailabilityRequest {
  phone?: string;
  email?: string;
  shopName?: string;
  slug?: string;
}

export interface CheckAvailabilityResult {
  available: boolean;
  message?: string;
}

export interface CheckAvailabilityResponse {
  phone?: CheckAvailabilityResult;
  email?: CheckAvailabilityResult;
  shopName?: CheckAvailabilityResult;
  slug?: CheckAvailabilityResult;
}

export interface LoginOtpRequest {
  phone: string;
  code: string;
}

export interface GoogleLoginRequest {
  googleAccessToken: string;
}

export interface ResetPasswordPhoneRequest {
  phone: string;
}

export interface ConfirmResetPhoneRequest {
  phone: string;
  code: string;
  newPassword: string;
}

export interface ResetPasswordEmailRequest {
  email: string;
}

export interface ConfirmResetEmailRequest {
  token: string;
  newPassword: string;
}

export interface SendEmailCodeRequest {
  email: string;
}

export interface VerifyEmailCodeRequest {
  code: string;
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

  sendOtp: async (data: SendOtpRequest) => {
    const response = await api.post<SendOtpResponse>('/auth/send-otp', data);
    return response;
  },

  sendOtpByEmail: async (data: SendOtpByEmailRequest) => {
    const response = await api.post<SendOtpByEmailResponse>('/auth/vendor/send-otp-by-email', data);
    return response;
  },

  registerOtp: async (data: RegisterOtpRequest) => {
    const response = await api.post<AuthResponse>('/auth/vendor/register-otp', data);
    if (response.accessToken) {
      setToken(response.accessToken);
    }
    return { token: response.accessToken, user: response.user, shop: response.shop };
  },

  checkAvailability: async (data: CheckAvailabilityRequest) => {
    const response = await api.post<CheckAvailabilityResponse>('/auth/check-availability', data);
    return response;
  },

  loginOtp: async (data: LoginOtpRequest) => {
    const response = await api.post<AuthResponse>('/auth/vendor/login-otp', data);
    if (response.accessToken) {
      setToken(response.accessToken);
    }
    return { token: response.accessToken, user: response.user, shop: response.shop };
  },

  googleLogin: async (data: GoogleLoginRequest) => {
    const response = await api.post<AuthResponse>('/auth/vendor/google', data);
    if (response.accessToken) {
      setToken(response.accessToken);
    }
    return { token: response.accessToken, user: response.user, shop: response.shop };
  },

  resetPasswordPhone: async (data: ResetPasswordPhoneRequest) => {
    return api.post<{ success: boolean; message: string }>('/auth/reset-password-phone', data);
  },

  confirmResetPhone: async (data: ConfirmResetPhoneRequest) => {
    return api.post<{ success: boolean; message: string }>('/auth/reset-password-phone/confirm', data);
  },

  resetPasswordEmail: async (data: ResetPasswordEmailRequest) => {
    return api.post<{ success: boolean; message: string }>('/auth/reset-password', data);
  },

  confirmResetEmail: async (data: ConfirmResetEmailRequest) => {
    return api.post<{ success: boolean; message: string }>('/auth/confirm-reset', data);
  },

  sendEmailCode: async (data: SendEmailCodeRequest) => {
    return api.post<{ success: boolean; message: string }>('/auth/send-email-code', data);
  },

  verifyEmailCode: async (data: VerifyEmailCodeRequest) => {
    return api.post<{ success: boolean; message: string }>('/auth/verify-email-code', data);
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
