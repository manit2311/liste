import axiosInstance from './axios';

export const auditAPI = {
  getAll: (page = 1, search = "") =>
    axiosInstance.get(`/audit/?page=${page}&search=${search}`),
};