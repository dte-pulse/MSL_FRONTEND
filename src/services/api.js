import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ================= AUTH =================
export const authService = {
  login: (employeeId, password) =>
    api.post("/login", { employee_id: employeeId, password }),
};

// ================= DOCTOR =================
export const doctorService = {
  getDoctors: (priorityOnly = false) =>
    api.get(`/doctors?priority_only=${priorityOnly}`),
  getDoctor: (id) => api.get(`/doctors/${id}`),
  createDoctor: (data) => api.post("/doctors", data),
  duplicateDoctor: (id) => api.post(`/doctors/${id}/duplicate`),
  deleteDoctor: (id) => api.delete(`/doctors/${id}`),
};

// ================= REQUEST =================
export const requestService = {
  getRequests: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.requested_by)
      queryParams.append("requested_by", params.requested_by);
    if (params.role) queryParams.append("role", params.role);

    return api.get(`/requests?${queryParams.toString()}`);
  },
  getRequest: (id) => api.get(`/requests/${id}`),
  createRequest: (data) => {
    console.log(
      "API createRequest - data being sent:",
      JSON.stringify(data, null, 2),
    );
    return api.post("/requests", data);
  },

  /**
   * Update request user classification
   * Backend expects: PUT /api/requests/{id}/user-classification?user_classification={value}
   * Valid values: 'potential', 'non-potential', 'default'
   *
   * Why this approach:
   * - The backend uses Query(...) which means it expects query parameters, not request body
   * - Axios PUT with params sends query parameters correctly
   * - We pass null as data since backend doesn't expect a body
   */
  updateStatus: async (id, status) => {
    // Validate inputs before making the request
    if (!id) {
      throw new Error("Request ID is required");
    }
    if (!status) {
      throw new Error("Status value is required");
    }

    const validStatuses = ["potential", "non-potential", "default"];
    if (!validStatuses.includes(status)) {
      throw new Error(
        `Invalid status: "${status}". Must be one of: ${validStatuses.join(", ")}`,
      );
    }

    const url = `/requests/${id}/user-classification`;
    const params = { user_classification: status };

    console.log(`[API] PUT ${url}`, { user_classification: status });

    try {
      // PUT with query params - pass null as request body
      const response = await api.put(url, null, { params });
      console.log(`[API] Status update successful:`, response.data);
      return response;
    } catch (error) {
      // Enhanced error logging for debugging
      console.error(`[API] Status update failed for request ${id}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        params: error.config?.params,
      });
      throw error;
    }
  },

  getLogs: (id) => api.get(`/requests/${id}/logs`),
};

// ================= INTERACTION =================
export const interactionService = {
  createInteraction: (data) => api.post("/doctor-interactions", data),

  getInteractions: (requestId) =>
    api.get(`/requests/${requestId}/interactions`),

  // Doctor History
  getDoctorHistory: (doctorName) =>
    api.get(
      `/doctor-interactions?doctor_name=${encodeURIComponent(doctorName)}`,
    ),
};

// ================= OFFICE ACTIVITY =================
export const activityService = {
  createActivity: (data) => api.post("/office-activities", data),

  getActivities: (mslUsername = null) => {
    const url = mslUsername
      ? `/office-activities?msl_username=${encodeURIComponent(mslUsername)}`
      : "/office-activities";

    return api.get(url);
  },

  getActivityUsers: () => api.get("/office-activities/users"),
};

export default api;
