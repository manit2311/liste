import axiosInstance from "./axios";

export const userAPI = {
  getAll: () => axiosInstance.get("/users/"),
  // getAllPlatform bypasses company_id filter — for Platform Users page
  getAllPlatform: () => axiosInstance.get("/users/", { params: { company_id: undefined } }),
  create: (data) => axiosInstance.post("/users/", data),
  update: (id, data) => axiosInstance.patch(`/users/${id}/`, data),
  delete: (id) => axiosInstance.delete(`/users/${id}/`),
};