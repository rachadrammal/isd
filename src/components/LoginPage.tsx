import { useState } from 'react';
import { Building2, Lock, User as UserIcon } from 'lucide-react';
import type { User } from '../App';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

// Mock user accounts
const mockAccounts = {
  admin: {
    username: 'admin',
    password: 'admin123',
    user: {
      id: '1',
      username: 'admin',
      role: 'admin' as const,
      name: 'Admin User'
    }
  },
  inventory: {
    username: 'inventory',
    password: 'inventory123',
    user: {
      id: '2',
      username: 'inventory',
      role: 'inventory_staff' as const,
      name: 'Inventory Staff'
    }
  },
  sales: {
    username: 'sales',
    password: 'sales123',
    user: {
      id: '3',
      username: 'sales',
      role: 'sales_staff' as const,
      name: 'Sales Staff'
    }
  },
  production: {
    username: 'production',
    password: 'production123',
    user: {
      id: '4',
      username: 'production',
      role: 'production_staff' as const,
      name: 'Production Staff'
    }
  }
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Find matching account
    const account = Object.values(mockAccounts).find(
      acc => acc.username === username && acc.password === password
    );

    if (account) {
      onLogin(account.user);
    } else {
      setError('Invalid username or password');
    }
  };

  const quickLogin = (accountKey: keyof typeof mockAccounts) => {
    onLogin(mockAccounts[accountKey].user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-gray-900 mb-2">Company Management System</h1>
            <p className="text-gray-600">Sign in to access your account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6">
            <button
              onClick={() => setShowCredentials(!showCredentials)}
              className="text-indigo-600 hover:text-indigo-700 text-sm"
            >
              {showCredentials ? 'Hide' : 'Show'} Demo Accounts
            </button>

            {showCredentials && (
              <div className="mt-4 space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900">Admin Account</p>
                      <p className="text-gray-600 text-sm">admin / admin123</p>
                    </div>
                    <button
                      onClick={() => quickLogin('admin')}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                    >
                      Login
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900">Inventory Staff</p>
                      <p className="text-gray-600 text-sm">inventory / inventory123</p>
                    </div>
                    <button
                      onClick={() => quickLogin('inventory')}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                    >
                      Login
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900">Sales Staff</p>
                      <p className="text-gray-600 text-sm">sales / sales123</p>
                    </div>
                    <button
                      onClick={() => quickLogin('sales')}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                    >
                      Login
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900">Production Staff</p>
                      <p className="text-gray-600 text-sm">production / production123</p>
                    </div>
                    <button
                      onClick={() => quickLogin('production')}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                    >
                      Login
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
