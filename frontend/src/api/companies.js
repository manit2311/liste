import axiosInstance from './axios';

export const companyAPI = {
  getAll: () => axiosInstance.get('/companies/'),
  create: (data) => axiosInstance.post('/companies/', data),
  update: (id, data) => axiosInstance.patch(`/companies/${id}/`, data),
  delete: (id) => axiosInstance.delete(`/companies/${id}/`),
};