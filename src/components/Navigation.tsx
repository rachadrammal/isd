import {
  Building2,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Factory,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import type { User, Page } from "../App";

interface NavigationProps {
  user: User;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  hasAccess: (page: Page) => boolean;
}

export function Navigation({
  user,
  currentPage,
  onNavigate,
  onLogout,
  hasAccess,
}: NavigationProps) {
  const navItems: { page: Page; label: string; icon: React.ReactNode }[] = [
    {
      page: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      page: "inventory",
      label: "Inventory",
      icon: <Package className="w-5 h-5" />,
    },
    {
      page: "sales",
      label: "Sales",
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      page: "production",
      label: "Production",
      icon: <Factory className="w-5 h-5" />,
    },
    {
      page: "alerts",
      label: "Alerts",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-indigo-600" />
            <span className="text-gray-900">CompanyMS</span>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              if (!hasAccess(item.page)) return null;

              return (
                <button
                  key={item.page}
                  onClick={() => onNavigate(item.page)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentPage === item.page
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-gray-900 text-sm">{user.name}</p>
              <p className="text-gray-500 text-xs capitalize">
                {user?.role?.replace("_staff", "")}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
