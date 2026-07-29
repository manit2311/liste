import axiosInstance from './axios';

export const authAPI = {
  login: async (username, password) => {
    const response = await axiosInstance.post('/auth/login/', { username, password });
    return response.data;
  },
  getCurrentUser: () => axiosInstance.get('/auth/me/'),
  resetAccount: (data) => axiosInstance.post('/auth/reset-account/', data),
};