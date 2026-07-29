import axiosInstance from './axios';

export const supplierAPI = {
  getAll: () => axiosInstance.get("/suppliers/"),
  getById: (id) => axiosInstance.get(`/suppliers/${id}/`),
  create: (data) => axiosInstance.post("/suppliers/", data),
  update: (id, data) => axiosInstance.put(`/suppliers/${id}/`, data),
  delete: (id) => axiosInstance.delete(`/suppliers/${id}/`),
};
