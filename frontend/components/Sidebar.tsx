"use client";

import { 
  LayoutDashboard, 
  Package, 
  Heart, 
  Inbox, 
  List, 
  Archive,
  ChevronRight,
  Shield,
  UserCheck,
  Key,
  Activity,
  Building2,
  BarChart3,
  TrendingUp,
  Users
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const { hasPermission } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: pathname === "/", path: "/" },
    { icon: Building2, label: "Danh sách hộ dân", active: pathname === "/apartment", path: "/apartment" },
    { icon: BarChart3, label: "Thống kê tài chính", active: pathname === "/financial", path: "/financial" },
    { icon: TrendingUp, label: "Phân tích tài chính", active: pathname === "/financial-stats", path: "/financial-stats" },
  ];



  return (
    <aside className="fixed left-4 top-4 bottom-4 w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-y-auto shadow-2xl z-20 border border-slate-700/50 lg:block">
      <div className="p-6">
        {/* Logo Section */}
        <div className="mb-10 pb-6 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-blue-400 font-bold text-xl">Blue</span>
                <span className="text-white font-bold text-xl">Moon</span>
              </div>
              <span className="text-slate-400 text-xs">Quản lý chung cư</span>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          {/* Main Menu Items */}
          <div className="mb-6">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={index}
                  href={item.path}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/50"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-full"></div>
                  )}
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} transition-colors`} />
                  <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 opacity-70" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Admin Section - Only visible to admins */}
          {hasPermission([UserRole.ADMIN, UserRole.MANAGER]) && (
            <div className="mb-6">
              <div className="flex items-center gap-2 px-4 pb-3">
                <div className="h-px flex-1 bg-slate-700"></div>
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Admin
                </p>
                <div className="h-px flex-1 bg-slate-700"></div>
              </div>
              <Link
                href="/admin"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  pathname === '/admin'
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {pathname === '/admin' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-400 rounded-r-full"></div>
                )}
                <Shield className={`w-5 h-5 ${pathname === '/admin' ? 'text-white' : 'text-slate-400 group-hover:text-red-400'} transition-colors`} />
                <span className="text-sm font-medium flex-1 text-left">Quản trị hệ thống</span>
                {pathname === '/admin' && (
                  <ChevronRight className="w-4 h-4 opacity-70" />
                )}
              </Link>

              {/* Visitor Management */}
              <Link
                href="/admin/visitors"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  pathname === '/admin/visitors'
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {pathname === '/admin/visitors' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-400 rounded-r-full"></div>
                )}
                <UserCheck className={`w-5 h-5 ${pathname === '/admin/visitors' ? 'text-white' : 'text-slate-400 group-hover:text-red-400'} transition-colors`} />
                <span className="text-sm font-medium flex-1 text-left">Quản lý khách</span>
                {pathname === '/admin/visitors' && (
                  <ChevronRight className="w-4 h-4 opacity-70" />
                )}
              </Link>

              {/* Resident Management */}
              <Link
                href="/admin/residents"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  pathname === '/admin/residents'
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {pathname === '/admin/residents' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-400 rounded-r-full"></div>
                )}
                <UserCheck className={`w-5 h-5 ${pathname === '/admin/residents' ? 'text-white' : 'text-slate-400 group-hover:text-red-400'} transition-colors`} />
                <span className="text-sm font-medium flex-1 text-left">Quản lý cư dân</span>
                {pathname === '/admin/residents' && (
                  <ChevronRight className="w-4 h-4 opacity-70" />
                )}
              </Link>

              {/* Access Control */}
              <Link
                href="/admin/access-control"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  pathname === '/admin/access-control'
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {pathname === '/admin/access-control' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-400 rounded-r-full"></div>
                )}
                <Key className={`w-5 h-5 ${pathname === '/admin/access-control' ? 'text-white' : 'text-slate-400 group-hover:text-red-400'} transition-colors`} />
                <span className="text-sm font-medium flex-1 text-left">Thẻ cư dân</span>
                {pathname === '/admin/access-control' && (
                  <ChevronRight className="w-4 h-4 opacity-70" />
                )}
              </Link>

              {/* Employee Management - Admin only */}
              {hasPermission([UserRole.ADMIN]) && (
                <Link
                  href="/admin/employees"
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                    pathname === '/admin/employees'
                      ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {pathname === '/admin/employees' && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-400 rounded-r-full"></div>
                  )}
                  <UserCheck className={`w-5 h-5 ${pathname === '/admin/employees' ? 'text-white' : 'text-slate-400 group-hover:text-red-400'} transition-colors`} />
                  <span className="text-sm font-medium flex-1 text-left">Quản lý nhân viên</span>
                  {pathname === '/admin/employees' && (
                    <ChevronRight className="w-4 h-4 opacity-70" />
                  )}
                </Link>
              )}

              {/* Activity Logs */}
              <Link
                href="/activity-logs"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  pathname === '/activity-logs'
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {pathname === '/activity-logs' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-400 rounded-r-full"></div>
                )}
                <Activity className={`w-5 h-5 ${pathname === '/activity-logs' ? 'text-white' : 'text-slate-400 group-hover:text-red-400'} transition-colors`} />
                <span className="text-sm font-medium flex-1 text-left">Nhật ký hoạt động</span>
                {pathname === '/activity-logs' && (
                  <ChevronRight className="w-4 h-4 opacity-70" />
                )}
              </Link>

              {/* Population Movements Management */}
              <Link
                href="/admin/population-movements"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  pathname === '/admin/population-movements'
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {pathname === '/admin/population-movements' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-400 rounded-r-full"></div>
                )}
                <Users className={`w-5 h-5 ${pathname === '/admin/population-movements' ? 'text-white' : 'text-slate-400 group-hover:text-red-400'} transition-colors`} />
                <span className="text-sm font-medium flex-1 text-left">Biến động nhân khẩu</span>
                {pathname === '/admin/population-movements' && (
                  <ChevronRight className="w-4 h-4 opacity-70" />
                )}
              </Link>
            </div>
          )}

          {/* User/Resident Features Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 px-4 pb-3">
              <div className="h-px flex-1 bg-slate-700"></div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cá nhân
              </p>
              <div className="h-px flex-1 bg-slate-700"></div>
            </div>

            {/* My Visitors */}
            <Link
              href="/my-visitors"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                pathname === '/my-visitors'
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/50"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {pathname === '/my-visitors' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-full"></div>
              )}
              <UserCheck className={`w-5 h-5 ${pathname === '/my-visitors' ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} transition-colors`} />
              <span className="text-sm font-medium flex-1 text-left">Khách của tôi</span>
              {pathname === '/my-visitors' && (
                <ChevronRight className="w-4 h-4 opacity-70" />
              )}
            </Link>

            {/* My Cards */}
            <Link
              href="/my-cards"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                pathname === '/my-cards'
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/50"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {pathname === '/my-cards' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-full"></div>
              )}
              <Key className={`w-5 h-5 ${pathname === '/my-cards' ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} transition-colors`} />
              <span className="text-sm font-medium flex-1 text-left">Thẻ của tôi</span>
              {pathname === '/my-cards' && (
                <ChevronRight className="w-4 h-4 opacity-70" />
              )}
            </Link>

            {/* Population Movements */}
            <Link
              href="/population-movements"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                pathname === '/population-movements'
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/50"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {pathname === '/population-movements' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-full"></div>
              )}
              <Users className={`w-5 h-5 ${pathname === '/population-movements' ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} transition-colors`} />
              <span className="text-sm font-medium flex-1 text-left">Biến động nhân khẩu</span>
              {pathname === '/population-movements' && (
                <ChevronRight className="w-4 h-4 opacity-70" />
              )}
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  );
}
