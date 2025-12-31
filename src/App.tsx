import { useState, useEffect } from "react";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { InventoryPage } from "./components/InventoryPage";
import { SalesPage } from "./components/SalesPage";
import { ProductionPage } from "./components/ProductionPage";
import { AlertPage } from "./components/AlertPage";
import { Navigation } from "./components/Navigation";

export type UserRole =
  | "admin"
  | "inventory_staff"
  | "sales_staff"
  | "production_staff";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

export type Page =
  | "dashboard"
  | "inventory"
  | "sales"
  | "production"
  | "alerts";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  // Check if user has access to a page
  const hasAccess = (page: Page): boolean => {
    if (!user) return false;

    if (user.role === "admin") return true;

    switch (user.role) {
      case "inventory_staff":
        return page === "inventory";
      case "sales_staff":
        return page === "sales";
      case "production_staff":
        return page === "production";
      default:
        return false;
    }
  };

  // Set default page based on user role
  useEffect(() => {
    if (!user) return;

    if (user.role === "admin") {
      setCurrentPage("dashboard");
    } else if (user.role === "inventory_staff") {
      setCurrentPage("inventory");
    } else if (user.role === "sales_staff") {
      setCurrentPage("sales");
    } else if (user.role === "production_staff") {
      setCurrentPage("production");
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    setCurrentPage("dashboard");
  };

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  // Check access before rendering page
  if (!hasAccess(currentPage)) {
    // Redirect to default page for user role
    if (user.role !== "admin") {
      const defaultPage = user.role.replace("_staff", "") as Page;
      if (currentPage !== defaultPage) {
        setCurrentPage(defaultPage);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        user={user}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        hasAccess={hasAccess}
      />

      <main className="container mx-auto px-4 py-8">
        {currentPage === "dashboard" && hasAccess("dashboard") && <Dashboard />}
        {currentPage === "inventory" && hasAccess("inventory") && (
          <InventoryPage />
        )}
        {currentPage === "sales" && hasAccess("sales") && <SalesPage />}
        {currentPage === "production" && hasAccess("production") && (
          <ProductionPage />
        )}
        {currentPage === "alerts" && hasAccess("alerts") && <AlertPage />}
      </main>
    </div>
  );
}
