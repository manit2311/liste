import { create } from 'zustand';
import { authAPI } from '../api/auth';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('access_token') || null,
  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      const { access, refresh, user } = response;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      set({ 
        user, 
        token: access, 
        loading: false, 
        isAuthenticated: true 
      });
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || 'Login failed';
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('access_token', token);
    set({ token, isAuthenticated: true });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isAuthenticated: false });
      return false;
    }
    
    try {
      const response = await authAPI.getCurrentUser();
      set({ user: response.data, isAuthenticated: true });
      return true;
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ isAuthenticated: false, user: null });
      return false;
    }
  },
}));