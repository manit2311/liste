import axios from 'axios';

// Create a single axios instance reading your backend environment URL
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper hooks for your primary data tables
export const productAPI = {
  getAll: (status = "", keyword = "") => {
    let url = "/products/";
    const params = new URLSearchParams();

    if (status) {
      params.append("status", status);
    }

    if (keyword) {
      params.append("search", keyword);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return axiosInstance.get(url);
  },
  getById: (id) => axiosInstance.get(`/products/${id}/`),
  create: (data) => axiosInstance.post("/products/", data),
  update: (id, data) => axiosInstance.put(`/products/${id}/`, data),
  delete: (id) => axiosInstance.delete(`/products/${id}/`),

  search: (search) =>
    axiosInstance.get(`/products/?search=${search}`),

  getLowStock: () =>
    axiosInstance.get("/products/?status=low"),

  getInStock: () =>
    axiosInstance.get("/products/?status=active"),
};

export const categoryAPI = {
  getAll: () => API.get('categories/'),
  create: (data) => API.post('categories/', data),
};

export const supplierAPI = {
  getAll: () => API.get('suppliers/'),
  create: (data) => API.post('suppliers/', data),
};

export default API;
