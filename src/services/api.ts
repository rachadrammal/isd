/**
 * API Service - Connects React Frontend to Python Backend
 * Update BASE_URL to match your backend server URL
 */

const BASE_URL = 'http://localhost:5000/api';

// Store JWT token
let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('auth_token', token);
};

export const getAuthToken = () => {
  if (!authToken) {
    authToken = localStorage.getItem('auth_token');
  }
  return authToken;
};

export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('auth_token');
};

// Generic API request function
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  logout: () => {
    clearAuthToken();
  },
};

// ============================================================================
// INVENTORY API
// ============================================================================

export const inventoryAPI = {
  getWarehouse: (warehouseType: string) => 
    apiRequest(`/inventory/${warehouseType}`),

  addItem: (warehouseType: string, item: any) =>
    apiRequest(`/inventory/${warehouseType}`, {
      method: 'POST',
      body: JSON.stringify(item),
    }),

  updateItem: (warehouseType: string, itemId: string, item: any) =>
    apiRequest(`/inventory/${warehouseType}/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    }),

  deleteItem: (warehouseType: string, itemId: string) =>
    apiRequest(`/inventory/${warehouseType}/${itemId}`, {
      method: 'DELETE',
    }),

  transferItem: (fromWarehouse: string, toWarehouse: string, itemId: string, quantity?: number) =>
    apiRequest('/inventory/transfer', {
      method: 'POST',
      body: JSON.stringify({
        from_warehouse: fromWarehouse,
        to_warehouse: toWarehouse,
        item_id: itemId,
        quantity,
      }),
    }),
};

// ============================================================================
// SALES API
// ============================================================================

export const salesAPI = {
  getOrders: () => apiRequest('/orders'),

  createOrder: (order: any) =>
    apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    }),

  updateOrder: (orderId: string, updates: any) =>
    apiRequest(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
};

// ============================================================================
// PRODUCTION API
// ============================================================================

export const productionAPI = {
  getProducts: () => apiRequest('/production/products'),

  getRuns: () => apiRequest('/production/runs'),

  getArchivedRuns: () => apiRequest('/production/archived'),

  createRun: (run: any) =>
    apiRequest('/production/runs', {
      method: 'POST',
      body: JSON.stringify(run),
    }),

  updateRun: (runId: string, updates: any) =>
    apiRequest(`/production/runs/${runId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  updateMachineStatus: (runId: string, stopped: boolean, reason?: string) =>
    apiRequest(`/production/runs/${runId}/machine-status`, {
      method: 'POST',
      body: JSON.stringify({
        machine_stopped: stopped,
        reason,
      }),
    }),
};

// ============================================================================
// ALERTS API (Admin Only)
// ============================================================================

export const alertsAPI = {
  getAlerts: () => apiRequest('/alerts'),

  createAlert: (alert: any) =>
    apiRequest('/alerts', {
      method: 'POST',
      body: JSON.stringify(alert),
    }),

  updateAlert: (alertId: string, updates: any) =>
    apiRequest(`/alerts/${alertId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  getCameras: () => apiRequest('/cameras'),

  /**
   * AI MODEL INTEGRATION POINT
   * Send camera frame for AI analysis (face detection, anomaly detection)
   */
  analyzeCameraFeed: (cameraId: string, frameData: any) =>
    apiRequest(`/cameras/${cameraId}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ frame_base64: frameData }),
    }),
};

// ============================================================================
// DASHBOARD API (Admin Only)
// ============================================================================

export const dashboardAPI = {
  /**
   * AI MODEL INTEGRATION POINT
   * Returns dashboard stats with AI predictions
   */
  getStats: () => apiRequest('/dashboard/stats'),

  /**
   * AI MODEL INTEGRATION POINT
   * Returns AI-powered business suggestions
   */
  getAISuggestions: () => apiRequest('/analytics/suggestions'),
};
