import axiosInstance from "./axios";

export const purchaseOrderAPI = {
  getAll: (status = "", search = "", page = 1) => {
    let url = "/purchase-orders/";
    const params = new URLSearchParams();

    if (status && status !== "all") params.append("status", status);
    if (search) params.append("search", search);
    if (page) params.append("page", page);
    if (params.toString()) url += `?${params.toString()}`;

    return axiosInstance.get(url);
  },
  getById: (id) => axiosInstance.get(`/purchase-orders/${id}/`),
  create: (data) => axiosInstance.post("/purchase-orders/", data),
  update: (id, data) => axiosInstance.put(`/purchase-orders/${id}/`, data),
  patch: (id, data) => axiosInstance.patch(`/purchase-orders/${id}/`, data),
  delete: (id) => axiosInstance.delete(`/purchase-orders/${id}/`),
};