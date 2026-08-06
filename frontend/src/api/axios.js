import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const raw = localStorage.getItem('company-store');
    if (raw) {
      const parsed = JSON.parse(raw);
      const selectedCompanyId = parsed?.state?.selectedCompanyId;
      // Skip adding company_id if the request explicitly set it to null (platform pages)
      if (selectedCompanyId && config.params?.company_id !== null) {
        config.params = { ...config.params, company_id: selectedCompanyId };
      }
    }
  } catch (e) {
    // ignore
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/auth/refresh/`,
          { refresh }
        );
        localStorage.setItem('access_token', res.data.access);
        original.headers.Authorization = `Bearer ${res.data.access}`;
        return axiosInstance(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;