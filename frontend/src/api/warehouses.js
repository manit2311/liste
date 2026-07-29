import axiosInstance from './axios';

export const warehouseAPI = {
  getAll: () => axiosInstance.get('/warehouses/'),
  getById: (id) => axiosInstance.get(`/warehouses/${id}/`),
  create: (data) => axiosInstance.post('/warehouses/', data),
  update: (id, data) => axiosInstance.put(`/warehouses/${id}/`, data),
  delete: (id) => axiosInstance.delete(`/warehouses/${id}/`),
  getStock: (id) => axiosInstance.get(`/warehouses/${id}/stock/`)
};