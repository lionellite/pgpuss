import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/refresh/', { refresh })
          localStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/connexion'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login/', data),
  register: (data) => api.post('/auth/register/', data),
  me: () => api.get('/auth/me/'),
  updateProfile: (data) => api.patch('/auth/me/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  users: (params) => api.get('/auth/users/', { params }),
  userDetail: (id) => api.get(`/auth/users/${id}/`),
  updateUser: (id, data) => api.patch(`/auth/users/${id}/`, data),
}

// Complaints
export const complaintsAPI = {
  list: (params) => api.get('/complaints/', { params }),
  create: (data) => api.post('/complaints/create/', data),
  detail: (id) => api.get(`/complaints/${id}/`),
  track: (ticket) => api.get(`/complaints/track/${ticket}/`),
  assign: (id, data) => api.post(`/complaints/${id}/assign/`, data),
  resolve: (id, data) => api.post(`/complaints/${id}/resolve/`, data),
  close: (id, data) => api.post(`/complaints/${id}/close/`, data),
  contest: (id, data) => api.post(`/complaints/${id}/contest/`, data),
  escalate: (id, data) => api.post(`/complaints/${id}/escalate/`, data),
  history: (id) => api.get(`/complaints/${id}/history/`),
  attachments: (id) => api.get(`/complaints/${id}/attachments/`),
  addAttachment: (id, formData) => api.post(`/complaints/${id}/attachments/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  categories: () => api.get('/complaints/categories/'),
}

// Establishments
export const establishmentsAPI = {
  list: (params) => api.get('/establishments/', { params }),
  detail: (id) => api.get(`/establishments/${id}/`),
  regions: () => api.get('/establishments/regions/'),
  services: (id) => api.get(`/establishments/${id}/services/`),
}

// Notifications
export const notificationsAPI = {
  list: () => api.get('/notifications/'),
  markRead: (id) => api.post(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/read-all/'),
  unreadCount: () => api.get('/notifications/unread-count/'),
}

// Analytics
export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard/'),
  publicStats: () => api.get('/analytics/public-stats/'),
  submitSatisfaction: (data) => api.post('/analytics/satisfaction/', data),
}

export default api
