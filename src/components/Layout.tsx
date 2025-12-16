import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Factory, 
  AlertTriangle, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { user, logout, hasAccess } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['admin', 'inventory'] },
    { id: 'sales', label: 'Sales', icon: ShoppingCart, roles: ['admin', 'sales'] },
    { id: 'production', label: 'Production', icon: Factory, roles: ['admin', 'production'] },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, roles: ['admin'] },
  ];

  const accessibleItems = menuItems.filter(item => hasAccess(item.roles as any));

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={`bg-gray-900 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          {sidebarOpen && <span className="font-semibold">CompanyMS</span>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="flex-1 p-4">
          {accessibleItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors ${
                  currentPage === item.id 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-gray-300"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-gray-900 capitalize">{currentPage}</h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                {user?.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
