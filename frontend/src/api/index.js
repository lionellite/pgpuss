import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Multipart : laisser le navigateur définir la boundary (pas application/json par défaut)
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
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
          const baseUrl = import.meta.env.VITE_API_URL || '/api'
          const { data } = await axios.post(`${baseUrl}/auth/refresh/`, { refresh })
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
  login: (data) => api.post('/auth/login/phone/', {
    username: data.email || data.username || data.phone,
    password: data.password
  }),
  register: (data) => api.post('/auth/register/', data),
  me: () => api.get('/auth/me/'),
  updateProfile: (data) => api.patch('/auth/me/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  users: (params) => api.get('/auth/users/', { params }),
  userDetail: (id) => api.get(`/auth/users/${id}/`),
  updateUser: (id, data) => api.patch(`/auth/users/${id}/`, data),
}

// Complaints (Bénin Workflow)
export const complaintsAPI = {
  list: (params) => api.get('/complaints/', { params }),
  /** Création JSON (recommandé — rapide, compatible Vercel) */
  createJson: (data) => api.post('/complaints/create/', data),
  /** Ancien envoi multipart (déconseillé en production serverless) */
  create: (data) => api.post('/complaints/create/', data),
  /** Médias après création : un fichier par appel, header X-Upload-Token */
  uploadDepositMedia: (complaintId, formData, uploadToken) =>
    api.post(`/complaints/${complaintId}/deposit-media/`, formData, {
      headers: { 'X-Upload-Token': uploadToken },
    }),
  detail: (id) => api.get(`/complaints/${id}/`),
  track: (ticket) => api.get(`/complaints/track/${ticket}/`),

  // Actions
  acknowledge: (id) => api.post(`/complaints/${id}/acknowledge/`),
  requestInfo: (id, data) => api.post(`/complaints/${id}/request-info/`, data),
  provideInfo: (id, data) => api.post(`/complaints/${id}/provide-info/`, data),
  qualify: (id, data) => api.post(`/complaints/${id}/qualify/`, data),
  assign: (id, data) => api.post(`/complaints/${id}/assign/`, data),
  acceptAssignment: (id, data) => api.post(`/complaints/${id}/accept-assignment/`, data),
  refuseAssignment: (id, data) => api.post(`/complaints/${id}/refuse-assignment/`, data),
  startInvestigation: (id) => api.post(`/complaints/${id}/start-investigation/`),
  investigationLog: (id, data) => api.post(`/complaints/${id}/investigation-log/`, data),
  requestExtension: (id, data) => api.post(`/complaints/${id}/request-extension/`, data),
  resolve: (id, data) => api.post(`/complaints/${id}/resolve/`, data),
  acknowledgeResolution: (id, data) => api.post(`/complaints/${id}/ack-resolution/`, data),
  validateResolution: (id, data) => api.post(`/complaints/${id}/validate-resolution/`, data),
  rejectResolution: (id, data) => api.post(`/complaints/${id}/reject-resolution/`, data),
  escalate: (id, data) => api.post(`/complaints/${id}/escalate/`, data),
  ddsAssignInspector: (id, data) => api.post(`/complaints/${id}/dds-assign-inspector/`, data),
  ddsInvestigation: (id, data) => api.post(`/complaints/${id}/dds-investigation/`, data),
  notifyParties: (id, data) => api.post(`/complaints/${id}/notify-parties/`, data),
  arbitrate: (id, data) => api.post(`/complaints/${id}/arbitrate/`, data),
  close: (id, data) => api.post(`/complaints/${id}/close/`, data),
  withdraw: (id, data) => api.post(`/complaints/${id}/withdraw/`, data),
  reopen: (id, data) => api.post(`/complaints/${id}/reopen/`, data),

  history: (id) => api.get(`/complaints/${id}/history/`),
  attachments: (id) => api.get(`/complaints/${id}/attachments/`),
  addAttachment: (id, formData) => api.post(`/complaints/${id}/attachments/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  documents: (id) => api.get(`/complaints/${id}/documents/`),
  updateDocument: (complaintId, docId, data) =>
    api.patch(`/complaints/${complaintId}/documents/${docId}/`, data),
  categories: () => api.get('/complaints/categories/'),
}

// Establishments
export const establishmentsAPI = {
  list: (params) => api.get('/establishments/', { params }),
  detail: (id) => api.get(`/establishments/${id}/`),
  regions: () => api.get('/establishments/regions/'),
  zones: () => api.get('/establishments/zones/'),
  services: (id) => api.get(`/establishments/${id}/services/`),
}

/** Administration plateforme — établissements et services */
export const adminEstablishmentsAPI = {
  list: (params) => api.get('/admin/establishments/', { params }),
  create: (data) => api.post('/admin/establishments/', data),
  update: (id, data) => api.patch(`/admin/establishments/${id}/`, data),
  delete: (id) => api.delete(`/admin/establishments/${id}/`),
  servicesList: (establishmentId) => api.get(`/admin/establishments/${establishmentId}/services/`),
  serviceCreate: (establishmentId, data) =>
    api.post(`/admin/establishments/${establishmentId}/services/`, data),
  serviceUpdate: (serviceId, data) => api.patch(`/admin/establishments/services/${serviceId}/`, data),
  serviceDelete: (serviceId) => api.delete(`/admin/establishments/services/${serviceId}/`),
}

/** Priorités configurables et permissions par rôle */
export const adminReferentialsAPI = {
  priorityLevels: () => api.get('/admin/priority-levels/'),
  priorityLevelCreate: (data) => api.post('/admin/priority-levels/', data),
  priorityLevelUpdate: (id, data) => api.patch(`/admin/priority-levels/${id}/`, data),
  priorityLevelDelete: (id) => api.delete(`/admin/priority-levels/${id}/`),
  rolePermissions: () => api.get('/admin/role-permissions/'),
  rolePermissionCreate: (data) => api.post('/admin/role-permissions/', data),
  rolePermissionUpdate: (id, data) => api.patch(`/admin/role-permissions/${id}/`, data),
  rolePermissionDelete: (id) => api.delete(`/admin/role-permissions/${id}/`),
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
