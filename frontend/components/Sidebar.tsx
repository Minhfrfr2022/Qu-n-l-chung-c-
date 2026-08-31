"use client";

import { useState } from "react";
import { 
  LayoutDashboard, 
  ChevronRight, 
  Shield, 
  UserCheck, 
  Key, 
  Activity, 
  Building2, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Wrench, 
  MessageSquare,
  Pin,
  PinOff
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const { hasPermission } = useAuth();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const isExpanded = isPinned || isHovered;

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: pathname === "/", path: "/" },
    { icon: MessageSquare, label: "Thông báo & Góp ý", active: pathname === "/notifications", path: "/notifications" },
    { icon: Building2, label: "Danh sách hộ dân", active: pathname === "/apartment", path: "/apartment" },
    { icon: BarChart3, label: "Thống kê tài chính", active: pathname === "/financial", path: "/financial" },
    { icon: TrendingUp, label: "Phân tích tài chính", active: pathname === "/financial-stats", path: "/financial-stats" },
  ];

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed left-3 top-3 bottom-3 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-y-auto shadow-2xl z-50 border border-slate-700/60 transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64 px-4" : "w-16 px-2"
      }`}
    >
      <div className="py-4 flex flex-col h-full">
        {/* Logo Section */}
        <div className="mb-6 pb-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 min-w-[40px] bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            {isExpanded && (
              <div className="flex flex-col whitespace-nowrap transition-opacity duration-300 opacity-100">
                <div className="flex items-center gap-1">
                  <span className="text-blue-400 font-bold text-lg">Blue</span>
                  <span className="text-white font-bold text-lg">Moon</span>
                </div>
                <span className="text-slate-400 text-[10px]">Quản lý chung cư</span>
              </div>
            )}
          </div>
          {isExpanded && (
            <button
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? "Bỏ ghim (tự động thu gọn khi rời chuột)" : "Ghim cố định thanh menu"}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              {isPinned ? <Pin className="w-4 h-4 text-blue-400" /> : <PinOff className="w-4 h-4" />}
            </button>
          )}
        </div>

        <nav className="space-y-2 flex-1">
          {/* Main Menu Items */}
          <div className="mb-6 space-y-1">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={index}
                  href={item.path}
                  title={!isExpanded ? item.label : undefined}
                  className={`w-full flex items-center ${isExpanded ? "gap-3 px-3.5" : "justify-center px-0"} py-2.5 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/40"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {isActive && isExpanded && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full"></div>
                  )}
                  <item.icon className={`w-5 h-5 min-w-[20px] ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} transition-colors`} />
                  {isExpanded && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                    </>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Admin Section */}
          {hasPermission([UserRole.ADMIN, UserRole.MANAGER]) && (
            <div className="mb-6 space-y-1">
              <div className="flex items-center gap-2 px-2 pb-2">
                <div className="h-px flex-1 bg-slate-700"></div>
                {isExpanded && (
                  <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Admin
                  </p>
                )}
                <div className="h-px flex-1 bg-slate-700"></div>
              </div>

              {[
                { path: "/admin", label: "Quản trị hệ thống", icon: Shield },
                { path: "/admin/visitors", label: "Quản lý khách", icon: UserCheck },
                { path: "/admin/maintenance", label: "Quản lý bảo trì", icon: Wrench },
                { path: "/admin/residents", label: "Quản lý cư dân", icon: UserCheck },
                { path: "/admin/access-control", label: "Thẻ cư dân", icon: Key },
                ...(hasPermission([UserRole.ADMIN]) ? [{ path: "/admin/employees", label: "Quản lý nhân viên", icon: UserCheck }] : []),
                { path: "/activity-logs", label: "Nhật ký hoạt động", icon: Activity },
                { path: "/admin/population-movements", label: "Biến động nhân khẩu", icon: Users },
              ].map((item, idx) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={idx}
                    href={item.path}
                    title={!isExpanded ? item.label : undefined}
                    className={`w-full flex items-center ${isExpanded ? "gap-3 px-3.5" : "justify-center px-0"} py-2.5 rounded-xl transition-all duration-200 group relative ${
                      isActive
                        ? "bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg shadow-red-500/40"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {isActive && isExpanded && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-400 rounded-r-full"></div>
                    )}
                    <item.icon className={`w-5 h-5 min-w-[20px] ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-red-400'} transition-colors`} />
                    {isExpanded && (
                      <>
                        <span className="text-sm font-medium flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Resident Features Section */}
          <div className="mb-4 space-y-1">
            <div className="flex items-center gap-2 px-2 pb-2">
              <div className="h-px flex-1 bg-slate-700"></div>
              {isExpanded && (
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Cá nhân
                </p>
              )}
              <div className="h-px flex-1 bg-slate-700"></div>
            </div>

            {[
              { path: "/my-visitors", label: "Khách của tôi", icon: UserCheck },
              { path: "/my-cards", label: "Thẻ của tôi", icon: Key },
              { path: "/population-movements", label: "Biến động nhân khẩu", icon: Users },
            ].map((item, idx) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={idx}
                  href={item.path}
                  title={!isExpanded ? item.label : undefined}
                  className={`w-full flex items-center ${isExpanded ? "gap-3 px-3.5" : "justify-center px-0"} py-2.5 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/40"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {isActive && isExpanded && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full"></div>
                  )}
                  <item.icon className={`w-5 h-5 min-w-[20px] ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} transition-colors`} />
                  {isExpanded && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}
