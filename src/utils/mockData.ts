import { Product, Order, ProductionTask, Alert, DashboardStats } from '../types';

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Premium Widget A',
    sku: 'WGT-001',
    quantity: 150,
    expiryDate: '2025-12-31',
    category: 'Electronics',
    price: 99.99,
    baseElements: [
      { id: 'be1', name: 'Plastic Casing', quantity: 1, unit: 'piece' },
      { id: 'be2', name: 'Circuit Board', quantity: 1, unit: 'piece' },
      { id: 'be3', name: 'Copper Wire', quantity: 0.5, unit: 'meter' }
    ]
  },
  {
    id: 'p2',
    name: 'Standard Widget B',
    sku: 'WGT-002',
    quantity: 320,
    expiryDate: '2026-06-30',
    category: 'Electronics',
    price: 49.99,
    baseElements: [
      { id: 'be4', name: 'Aluminum Frame', quantity: 1, unit: 'piece' },
      { id: 'be5', name: 'LED Display', quantity: 1, unit: 'piece' }
    ]
  },
  {
    id: 'p3',
    name: 'Deluxe Component C',
    sku: 'CMP-003',
    quantity: 85,
    expiryDate: '2025-09-15',
    category: 'Components',
    price: 149.99,
    baseElements: [
      { id: 'be6', name: 'Steel Body', quantity: 1, unit: 'piece' },
      { id: 'be7', name: 'Control Unit', quantity: 1, unit: 'piece' },
      { id: 'be8', name: 'Power Supply', quantity: 1, unit: 'piece' }
    ]
  },
  {
    id: 'p4',
    name: 'Basic Module D',
    sku: 'MOD-004',
    quantity: 450,
    expiryDate: '2027-03-20',
    category: 'Modules',
    price: 29.99
  },
  {
    id: 'p5',
    name: 'Advanced System E',
    sku: 'SYS-005',
    quantity: 45,
    expiryDate: '2025-08-10',
    category: 'Systems',
    price: 299.99,
    baseElements: [
      { id: 'be9', name: 'Motherboard', quantity: 1, unit: 'piece' },
      { id: 'be10', name: 'Memory Module', quantity: 2, unit: 'piece' },
      { id: 'be11', name: 'Cooling Fan', quantity: 1, unit: 'piece' }
    ]
  }
];

export const mockOrders: Order[] = [
  {
    id: 'o1',
    customerName: 'Acme Corporation',
    items: [
      { productId: 'p1', productName: 'Premium Widget A', quantity: 10, price: 99.99 },
      { productId: 'p2', productName: 'Standard Widget B', quantity: 5, price: 49.99 }
    ],
    status: 'completed',
    total: 1249.85,
    date: '2025-12-10'
  },
  {
    id: 'o2',
    customerName: 'TechStart Inc',
    items: [
      { productId: 'p3', productName: 'Deluxe Component C', quantity: 3, price: 149.99 }
    ],
    status: 'processing',
    total: 449.97,
    date: '2025-12-12'
  },
  {
    id: 'o3',
    customerName: 'Global Solutions Ltd',
    items: [
      { productId: 'p5', productName: 'Advanced System E', quantity: 2, price: 299.99 },
      { productId: 'p4', productName: 'Basic Module D', quantity: 10, price: 29.99 }
    ],
    status: 'pending',
    total: 899.88,
    date: '2025-12-13'
  },
  {
    id: 'o4',
    customerName: 'Innovation Labs',
    items: [
      { productId: 'p1', productName: 'Premium Widget A', quantity: 15, price: 99.99 }
    ],
    status: 'processing',
    total: 1499.85,
    date: '2025-12-13'
  }
];

export const mockProductionTasks: ProductionTask[] = [
  {
    id: 'pt1',
    productId: 'p1',
    productName: 'Premium Widget A',
    quantity: 50,
    status: 'in-progress',
    startDate: '2025-12-10',
    baseElements: [
      { id: 'be1', name: 'Plastic Casing', quantity: 50, unit: 'piece' },
      { id: 'be2', name: 'Circuit Board', quantity: 50, unit: 'piece' },
      { id: 'be3', name: 'Copper Wire', quantity: 25, unit: 'meter' }
    ]
  },
  {
    id: 'pt2',
    productId: 'p3',
    productName: 'Deluxe Component C',
    quantity: 30,
    status: 'scheduled',
    startDate: '2025-12-15',
    baseElements: [
      { id: 'be6', name: 'Steel Body', quantity: 30, unit: 'piece' },
      { id: 'be7', name: 'Control Unit', quantity: 30, unit: 'piece' },
      { id: 'be8', name: 'Power Supply', quantity: 30, unit: 'piece' }
    ]
  },
  {
    id: 'pt3',
    productId: 'p2',
    productName: 'Standard Widget B',
    quantity: 100,
    status: 'completed',
    startDate: '2025-12-05',
    endDate: '2025-12-09',
    baseElements: [
      { id: 'be4', name: 'Aluminum Frame', quantity: 100, unit: 'piece' },
      { id: 'be5', name: 'LED Display', quantity: 100, unit: 'piece' }
    ]
  }
];

export const mockAlerts: Alert[] = [
  {
    id: 'a1',
    type: 'unauthorized',
    severity: 'high',
    message: 'Unauthorized person detected in restricted area - Warehouse Section B',
    timestamp: '2025-12-13T09:45:00',
    cameraId: 'CAM-003',
    imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400',
    resolved: false
  },
  {
    id: 'a2',
    type: 'anomaly',
    severity: 'critical',
    message: 'Equipment malfunction detected - Production Line 2',
    timestamp: '2025-12-13T08:30:00',
    cameraId: 'CAM-007',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
    resolved: false
  },
  {
    id: 'a3',
    type: 'safety',
    severity: 'medium',
    message: 'Safety protocol violation - Missing protective equipment',
    timestamp: '2025-12-13T07:15:00',
    cameraId: 'CAM-005',
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400',
    resolved: true
  },
  {
    id: 'a4',
    type: 'anomaly',
    severity: 'high',
    message: 'Unusual activity pattern detected in Storage Area',
    timestamp: '2025-12-12T22:20:00',
    cameraId: 'CAM-012',
    imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400',
    resolved: true
  },
  {
    id: 'a5',
    type: 'equipment',
    severity: 'low',
    message: 'Temperature deviation in Cold Storage Unit 3',
    timestamp: '2025-12-12T18:45:00',
    cameraId: 'CAM-009',
    resolved: false
  }
];

export const mockDashboardStats: DashboardStats = {
  totalRevenue: 245680,
  totalOrders: 143,
  productionUnits: 3250,
  activeAlerts: 3,
  revenueChange: 12.5,
  ordersChange: 8.3,
  productionChange: -2.1
};

export const revenueChartData = [
  { month: 'Jan', revenue: 18500, orders: 45 },
  { month: 'Feb', revenue: 22300, orders: 52 },
  { month: 'Mar', revenue: 19800, orders: 48 },
  { month: 'Apr', revenue: 25600, orders: 61 },
  { month: 'May', revenue: 28900, orders: 68 },
  { month: 'Jun', revenue: 31200, orders: 72 },
  { month: 'Jul', revenue: 29500, orders: 67 },
  { month: 'Aug', revenue: 33800, orders: 78 },
  { month: 'Sep', revenue: 36200, orders: 84 },
  { month: 'Oct', revenue: 38900, orders: 89 },
  { month: 'Nov', revenue: 42100, orders: 95 },
  { month: 'Dec', revenue: 45680, orders: 103 }
];

export const productionChartData = [
  { week: 'Week 1', produced: 520, target: 500 },
  { week: 'Week 2', produced: 580, target: 550 },
  { week: 'Week 3', produced: 490, target: 500 },
  { week: 'Week 4', produced: 650, target: 600 },
];

export const categoryDistribution = [
  { name: 'Electronics', value: 45, color: '#3B82F6' },
  { name: 'Components', value: 25, color: '#10B981' },
  { name: 'Modules', value: 18, color: '#F59E0B' },
  { name: 'Systems', value: 12, color: '#EF4444' }
];
