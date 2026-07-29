import axiosInstance from "./axios";

export const orderAPI = {
  getAll: (status = "", search = "", page = 1) => {
    let url = "/orders/";
    const params = new URLSearchParams();

    if (status && status !== "all") params.append("status", status);
    if (search) params.append("search", search);
    if (page) params.append("page", page);
    if (params.toString()) url += `?${params.toString()}`;

    return axiosInstance.get(url);
  },
  getById: (id) => axiosInstance.get(`/orders/${id}/`),
  create: (data) => axiosInstance.post("/orders/", data),
  update: (id, data) => axiosInstance.put(`/orders/${id}/`, data),
  patch: (id, data) => axiosInstance.patch(`/orders/${id}/`, data),
  delete: (id) => axiosInstance.delete(`/orders/${id}/`),
};