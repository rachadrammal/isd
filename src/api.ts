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
  // Fetch all items in a warehouse
  getWarehouse: async (warehouseType: string) => {
    const res = await fetch(
      `http://localhost:5000/api/inventory/${warehouseType}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    if (!res.ok) throw new Error("Failed to fetch warehouse");
    return res.json();
  },

  addItem: async (warehouseType: string, payload: any) => {
    const res = await fetch(
      `http://localhost:5000/api/inventory/${warehouseType}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) throw new Error("Failed to add item");
    return res.json();
  },

  updateItem: async (id: string, payload: any) => {
    const res = await fetch(`http://localhost:5000/api/inventory/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update item");
    return res.json();
  },

  deleteItem: async (id: string) => {
    const res = await fetch(`http://localhost:5000/api/inventory/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) throw new Error("Failed to delete item");
    return res.json();
  },

  transferItem: async (
    sourceWarehouse: string,
    targetWarehouse: string,
    id: string,
    qty: number
  ) => {
    const res = await fetch(`http://localhost:5000/api/inventory/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ sourceWarehouse, targetWarehouse, id, qty }),
    });
    if (!res.ok) throw new Error("Failed to transfer item");
    return res.json();
  },
  getArchive: async () => {
    const res = await fetch(`http://localhost:5000/api/inventory/archive`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error("Failed to fetch archive");
    return res.json();
  },
};

//ALERTS API
export const alertsAPI = {
  getAlerts: async () => {
    const res = await api.get("/alerts");
    return res.data;
  },
  updateStatus: async (id: string, status: string) => {
    const res = await api.put(`/alerts/${id}/status`, { status });
    return res.data;
  },
};
// ==============================
// DASHBOARD API (ADMIN)
// ==============================
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats").then((r) => r.data),

  getAISuggestions: () => api.get("/analytics/suggestions").then((r) => r.data),
};

export default api;
