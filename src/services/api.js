import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth Service
export const authService = {
  login: (username, role) => api.post('/login', { username, role }),
};

// Doctor Service
export const doctorService = {
  getDoctors: (priorityOnly = false) => api.get(`/doctors?priority_only=${priorityOnly}`),
  getDoctor: (id) => api.get(`/doctors/${id}`),
  createDoctor: (data) => api.post('/doctors', data),
  duplicateDoctor: (id) => api.post(`/doctors/${id}/duplicate`),
  deleteDoctor: (id) => api.delete(`/doctors/${id}`),
};

// Request Service
export const requestService = {
  getRequests: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.requested_by) queryParams.append('requested_by', params.requested_by);
    if (params.role) queryParams.append('role', params.role);
    if (params.status) queryParams.append('status', params.status);
    return api.get(`/requests?${queryParams.toString()}`);
  },
  getRequest: (id) => api.get(`/requests/${id}`),
  createRequest: (data) => api.post('/requests', data),
  updateStatus: (id, status) => api.put(`/requests/${id}/status?status=${status}`),
  getLogs: (id) => api.get(`/requests/${id}/logs`),
};

// Interaction Service
export const interactionService = {
  createInteraction: (data) => api.post('/doctor-interactions', data),
  getInteractions: (requestId) => api.get(`/requests/${requestId}/interactions`),
};

// Office Activity Service
export const activityService = {
  createActivity: (data) => api.post('/office-activities', data),
  getActivities: (requestId) => api.get(`/requests/${requestId}/activities`),
};

// Seed Service
export const seedService = {
  seedDoctors: () => api.post('/seed-doctors'),
};

export default api;