"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/auth";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  Users,
  Shield,
  Database,
  Settings,
  Activity,
  FileText,
  UserCog,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { user } = useAuth();

  const adminStats = [
    {
      icon: Users,
      label: "Tổng người dùng",
      value: "248",
      change: "+12%",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: Shield,
      label: "Vai trò đã tạo",
      value: "3",
      change: "0%",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      icon: Activity,
      label: "Hoạt động hôm nay",
      value: "156",
      change: "+23%",
      gradient: "from-green-500 to-green-600",
    },
    {
      icon: Database,
      label: "Dung lượng lưu trữ",
      value: "45GB",
      change: "+5GB",
      gradient: "from-orange-500 to-orange-600",
    },
  ];

  const adminFeatures = [
    {
      icon: UserCog,
      title: "Quản lý người dùng",
      description: "Tạo, sửa, xóa tài khoản người dùng và gán vai trò",
      gradient: "from-blue-500 to-blue-600",
      path: "/admin/users",
      available: true,
    },
    {
      icon: Shield,
      title: "Phân quyền hệ thống",
      description: "Cấu hình quyền truy cập cho các vai trò khác nhau",
      gradient: "from-purple-500 to-purple-600",
      path: "/admin/permissions",
    },
    {
      icon: Settings,
      title: "Cài đặt hệ thống",
      description: "Cấu hình các thông số và tính năng của ứng dụng",
      gradient: "from-orange-500 to-orange-600",
      path: "/admin/settings",
    },
    {
      icon: FileText,
      title: "Báo cáo tổng hợp",
      description: "Xem và xuất các báo cáo chi tiết về hệ thống",
      gradient: "from-green-500 to-green-600",
      path: "/admin/reports",
    },
    {
      icon: Activity,
      title: "Nhật ký hoạt động",
      description: "Theo dõi lịch sử hoạt động của người dùng",
      gradient: "from-red-500 to-red-600",
      path: "/admin/logs",
    },
    {
      icon: BarChart3,
      title: "Thống kê nâng cao",
      description: "Phân tích dữ liệu và xu hướng sử dụng",
      gradient: "from-cyan-500 to-cyan-600",
      path: "/admin/analytics",
    },
  ];

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Sidebar />
        <div className="ml-72 mr-4">
          <Header />

          <main className="p-6">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                Trang quản trị hệ thống
              </h1>
              <p className="text-slate-400">
                Chào mừng {user?.fullName}, bạn có toàn quyền quản lý hệ thống
              </p>
            </div>

            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {adminStats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-green-400">
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                  <p className="text-slate-100 text-2xl font-bold">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Admin Features Grid */}
            <div>
              <h2 className="text-2xl font-bold text-slate-200 mb-4">
                Công cụ quản trị
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminFeatures.map((feature, index) => {
                  const Component = feature.available ? Link : 'button';
                  return (
                  <Component
                    key={index}
                    href={feature.available ? feature.path : undefined}
                    className="group relative bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-2 text-left overflow-hidden block"
                  >
                    {/* Background Glow Effect */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                    />

                    {/* Icon */}
                    <div
                      className={`relative bg-gradient-to-br ${feature.gradient} rounded-xl p-4 w-fit mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="relative text-xl font-bold text-slate-200 mb-2 group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="relative text-slate-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Admin Badge */}
                    <div className="relative mt-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold rounded-full">
                        <Shield className="w-3 h-3" />
                        Chỉ Admin
                      </span>
                      {feature.available && (
                        <ArrowRight className="w-5 h-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </Component>
                  );
                })}
              </div>
            </div>

            {/* Warning Section */}
            <div className="mt-8 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-600/50 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="bg-yellow-500 rounded-xl p-3 shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-yellow-400 mb-2">
                    Lưu ý quan trọng
                  </h3>
                  <p className="text-yellow-200/90">
                    Bạn đang truy cập với quyền Quản trị viên. Mọi thay đổi có
                    thể ảnh hưởng đến toàn bộ hệ thống. Vui lòng cẩn thận khi
                    thực hiện các thao tác quan trọng.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
