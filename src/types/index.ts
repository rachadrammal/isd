// Type definitions for the company management system

export type UserRole = 'admin' | 'inventory' | 'sales' | 'production';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  expiryDate: string;
  category: string;
  baseElements?: BaseElement[];
  price: number;
}

export interface BaseElement {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total: number;
  date: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface ProductionTask {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  status: 'scheduled' | 'in-progress' | 'completed';
  startDate: string;
  endDate?: string;
  baseElements: BaseElement[];
}

export interface Alert {
  id: string;
  type: 'anomaly' | 'unauthorized' | 'safety' | 'equipment';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  cameraId: string;
  imageUrl?: string;
  resolved: boolean;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  productionUnits: number;
  activeAlerts: number;
  revenueChange: number;
  ordersChange: number;
  productionChange: number;
}
