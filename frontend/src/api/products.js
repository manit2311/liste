import axiosInstance from "./axios";

export const productAPI = {
  getAll: (status = "", search = "", page = 1) => {
    let url = "/products/";
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("status", status);
    if (search) params.append("search", search);
    if (page) params.append("page", page);
    if (params.toString()) url += `?${params.toString()}`;
    return axiosInstance.get(url);
  },
  getById: (id) => axiosInstance.get(`/products/${id}/`),
  create: (data) => axiosInstance.post("/products/", data),
  update: (id, data) => axiosInstance.put(`/products/${id}/`, data),
  delete: (id) => axiosInstance.delete(`/products/${id}/`),
  restore: (id) => axiosInstance.post(`/products/${id}/restore/`),
  getLowStock: () => axiosInstance.get("/products/low_stock/"),

  assign: (id, data) => axiosInstance.post(`/products/${id}/assign/`, data),
  transferStock: (id, data) => axiosInstance.post(`/products/${id}/transfer_stock/`, data),
  unassign: (id, data) => axiosInstance.post(`/products/${id}/unassign/`, data),
};