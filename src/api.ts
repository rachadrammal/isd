/**
 * API Service - Connects React Frontend to Flask Backend
 */

import axios from "axios";

// ==============================
// AXIOS INSTANCE
// ==============================
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ==============================
// JWT INTERCEPTOR
// ==============================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==============================
// AUTH API
// ==============================
export const authAPI = {
  login: async (username: string, password: string) => {
    const res = await api.post("/auth/login", { username, password });
    localStorage.setItem("token", res.data.token);
    return res.data;
  },

  logout: () => {
    localStorage.removeItem("token");
  },
};

// ==============================
// INVENTORY API
// ==============================
export const inventoryAPI = {
  getWarehouse: (warehouseType: string) =>
    api.get(`/inventory/${warehouseType}`).then((r) => r.data),

  addItem: (warehouseType: string, item: any) =>
    api.post(`/inventory/${warehouseType}`, item).then((r) => r.data),

  updateItem: (warehouseType: string, itemId: string, item: any) =>
    api.put(`/inventory/${warehouseType}/${itemId}`, item).then((r) => r.data),

  deleteItem: (warehouseType: string, itemId: string) =>
    api.delete(`/inventory/${warehouseType}/${itemId}`).then((r) => r.data),

  transferItem: (
    fromWarehouse: string,
    toWarehouse: string,
    itemId: string,
    quantity?: number
  ) =>
    api
      .post("/inventory/transfer", {
        from_warehouse: fromWarehouse,
        to_warehouse: toWarehouse,
        item_id: itemId,
        quantity,
      })
      .then((r) => r.data),
};

// ==============================
// SALES API
// ==============================
export const salesAPI = {
  getOrders: () => api.get("/orders").then((r) => r.data),

  createOrder: (order: any) => api.post("/orders", order).then((r) => r.data),

  updateOrder: (orderId: string, updates: any) =>
    api.put(`/orders/${orderId}`, updates).then((r) => r.data),
};

// ==============================
// PRODUCTION API
// ==============================
export const productionAPI = {
  getProducts: () => api.get("/production/products").then((r) => r.data),

  getRuns: () => api.get("/production/runs").then((r) => r.data),

  getArchivedRuns: () => api.get("/production/archived").then((r) => r.data),

  createRun: (run: any) =>
    api.post("/production/runs", run).then((r) => r.data),

  updateRun: (runId: string, updates: any) =>
    api.put(`/production/runs/${runId}`, updates).then((r) => r.data),

  updateMachineStatus: (runId: string, stopped: boolean, reason?: string) =>
    api
      .post(`/production/runs/${runId}/machine-status`, {
        machine_stopped: stopped,
        reason,
      })
      .then((r) => r.data),
};

// ==============================
// ALERTS API (ADMIN)
// ==============================
export const alertsAPI = {
  getAlerts: () => api.get("/alerts").then((r) => r.data),

  createAlert: (alert: any) => api.post("/alerts", alert).then((r) => r.data),

  updateAlert: (alertId: string, updates: any) =>
    api.put(`/alerts/${alertId}`, updates).then((r) => r.data),

  getCameras: () => api.get("/cameras").then((r) => r.data),

  analyzeCameraFeed: (cameraId: string, frameBase64: string) =>
    api
      .post(`/cameras/${cameraId}/analyze`, {
        frame_base64: frameBase64,
      })
      .then((r) => r.data),
};

// ==============================
// DASHBOARD API (ADMIN)
// ==============================
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats").then((r) => r.data),

  getAISuggestions: () => api.get("/analytics/suggestions").then((r) => r.data),
};

export default api;
