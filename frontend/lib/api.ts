import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Attach token from localStorage on each request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
  logout: () => api.post("/api/auth/logout"),
};

// ── Interview ─────────────────────────────────────────────────────
export const interviewAPI = {
  start: (data: {
    type: string;
    domain: string;
    difficulty: string;
    duration_minutes: number;
    job_description?: string;
  }) => api.post("/api/interview/start", data),

  getSession: (sessionId: string) =>
    api.get(`/api/interview/session/${sessionId}`),

  submitAnswer: (sessionId: string, data: { question_id: string; answer: string; duration_seconds: number }) =>
    api.post(`/api/interview/session/${sessionId}/answer`, data),

  endSession: (sessionId: string) =>
    api.post(`/api/interview/session/${sessionId}/end`),

  getReport: (sessionId: string) =>
    api.get(`/api/interview/session/${sessionId}/report`),

  getSessions: () => api.get("/api/interview/sessions"),
};

// ── Dashboard ─────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get("/api/dashboard/stats"),
  getProgress: () => api.get("/api/dashboard/progress"),
};

export default api;
