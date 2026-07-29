import axiosInstance from "./axios";

export const categoryAPI={
    getAll:()=>axiosInstance.get("/categories/"),
    getById:(id)=>axiosInstance.get(`/categories/${id}/`),
    create:(data)=>axiosInstance.post("/categories/",data),
    update:(id,data)=>axiosInstance.put(`/categories/${id}/`,data),
    delete:(id)=>axiosInstance.delete(`/categories/${id}/`)
};