import { useState } from "react";
import { AdminLogin } from "./components/admin/AdminLogin";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { ProcessList } from "./components/user/ProcessList";
import { ProcessProvider } from "./context/ProcessContext";

export default function App() {
  const [view, setView] = useState<
    "user" | "admin-login" | "admin-dashboard"
  >("user");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
    setView("admin-dashboard");
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setView("user");
  };

  return (
    <ProcessProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Process Guide System
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView("user")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    view === "user"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  User View
                </button>
                {isAdminLoggedIn ? (
                  <>
                    <button
                      onClick={() => setView("admin-dashboard")}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        view === "admin-dashboard"
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Admin Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setView("admin-login")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      view === "admin-login"
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Admin Login
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          {view === "user" && <ProcessList />}
          {view === "admin-login" && (
            <AdminLogin onLogin={handleAdminLogin} />
          )}
          {view === "admin-dashboard" && <AdminDashboard />}
        </main>
      </div>
    </ProcessProvider>
  );
}