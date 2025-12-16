import { TrendingUp, TrendingDown, Package, ShoppingCart, Factory, AlertTriangle, DollarSign, Users } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for charts
const salesData = [
  { month: 'Jan', sales: 45000, orders: 120 },
  { month: 'Feb', sales: 52000, orders: 145 },
  { month: 'Mar', sales: 48000, orders: 132 },
  { month: 'Apr', sales: 61000, orders: 168 },
  { month: 'May', sales: 55000, orders: 151 },
  { month: 'Jun', sales: 67000, orders: 189 },
];

const productionData = [
  { month: 'Jan', produced: 850, target: 800 },
  { month: 'Feb', produced: 920, target: 900 },
  { month: 'Mar', produced: 880, target: 850 },
  { month: 'Apr', produced: 1050, target: 1000 },
  { month: 'May', produced: 980, target: 950 },
  { month: 'Jun', produced: 1120, target: 1100 },
];

const inventoryDistribution = [
  { name: 'Raw Materials', value: 35 },
  { name: 'In Production', value: 25 },
  { name: 'Finished Goods', value: 30 },
  { name: 'Reserved', value: 10 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

const recentActivities = [
  { id: 1, type: 'sale', message: 'New order #1234 received', time: '5 min ago', icon: ShoppingCart, color: 'text-green-600' },
  { id: 2, type: 'production', message: 'Production batch #456 completed', time: '12 min ago', icon: Factory, color: 'text-blue-600' },
  { id: 3, type: 'alert', message: 'Low stock alert: Product ABC', time: '1 hour ago', icon: AlertTriangle, color: 'text-red-600' },
  { id: 4, type: 'inventory', message: 'Inventory updated: 50 new items', time: '2 hours ago', icon: Package, color: 'text-indigo-600' },
];

const aiSuggestions = [
  {
    id: 1,
    title: 'Production Optimization',
    description: 'Increase production of Product A by 15% based on demand forecast',
    confidence: 92,
    impact: 'high'
  },
  {
    id: 2,
    title: 'Inventory Reorder',
    description: 'Reorder raw material X within 3 days to avoid stockout',
    confidence: 88,
    impact: 'medium'
  },
  {
    id: 3,
    title: 'Sales Strategy',
    description: 'Bundle products B and C for 20% increase in average order value',
    confidence: 85,
    impact: 'high'
  },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Real-time insights and analytics for your company</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">12.5%</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
          <p className="text-gray-900 text-2xl">$328,000</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">8.2%</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total Orders</p>
          <p className="text-gray-900 text-2xl">905</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Factory className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">5.7%</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Production Output</p>
          <p className="text-gray-900 text-2xl">5,800</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex items-center gap-1 text-red-600">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm">3.1%</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Inventory Items</p>
          <p className="text-gray-900 text-2xl">1,245</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-gray-900 mb-4">Sales Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name="Sales ($)" />
              <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Production Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-gray-900 mb-4">Production vs Target</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="produced" fill="#8b5cf6" name="Produced" />
              <Bar dataKey="target" fill="#e5e7eb" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-gray-900 mb-4">Inventory Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={inventoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {inventoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm">{activity.message}</p>
                    <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-gray-900">AI Suggestions</h2>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">AI</span>
          </div>
          <div className="space-y-3">
            {aiSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-gray-900 text-sm">{suggestion.title}</p>
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    suggestion.impact === 'high' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {suggestion.impact}
                  </span>
                </div>
                <p className="text-gray-600 text-xs mb-2">{suggestion.description}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-purple-600 h-1.5 rounded-full" 
                      style={{ width: `${suggestion.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{suggestion.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
