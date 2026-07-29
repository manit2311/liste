import axiosInstance from './axios';

export const notificationAPI = {
  getAll: (page = 1) => axiosInstance.get(`/notifications/?page=${page}`),
  getUnread: () => axiosInstance.get('/notifications/?is_read=false'),
  markAsRead: (id) => axiosInstance.patch(`/notifications/${id}/`, { is_read: true }),
  markAllAsRead: () => axiosInstance.post('/notifications/mark_all_read/'),
  delete: (id) => axiosInstance.delete(`/notifications/${id}/`),
};