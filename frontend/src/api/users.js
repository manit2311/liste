import axiosInstance from "./axios";

export const userAPI = {
  getAll: () => axiosInstance.get("/users/"),
  create: (data) => axiosInstance.post("/users/", data),
  update: (id, data) => axiosInstance.patch(`/users/${id}/`, data),
  delete: (id) => axiosInstance.delete(`/users/${id}/`),
};