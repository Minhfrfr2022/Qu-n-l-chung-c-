"use client";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import {
  Users,
  BarChart3,
  FileText,
  Wrench,
  Building2,
  Car,
  Clipboard,
  MessageSquare,
  UserCog,
  ShieldCheck,
  Home as HomeIcon,
  DollarSign,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getActivityStats } from "@/helper/activityLogApi";
import { ActivityStats } from "@/types/activityLog";

export default function Home() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch activity statistics for admin/manager
  useEffect(() => {
    const fetchStats = async () => {
      if (!user || ![UserRole.ADMIN, UserRole.MANAGER].includes(user.role as UserRole)) {
        return;
      }

      setLoadingStats(true);
      try {
        const stats = await getActivityStats();
        setActivityStats(stats);
      } catch (error) {
        console.error("Failed to fetch activity stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user]);

  const functionCards = [
    {
      icon: Users,
      title: "Danh sách hộ dân",
      description: "Quản lý thông tin các hộ dân trong chung cư",
      gradient: "from-blue-500 to-blue-600",
      shadowColor: "shadow-blue-500/50",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER],
      path: "/apartment",
    },
    {
      icon: BarChart3,
      title: "Thống kê thu chi",
      description: "Theo dõi chi tiết các khoản thu chi của chung cư",
      gradient: "from-green-500 to-green-600",
      shadowColor: "shadow-green-500/50",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER],
      path: "/financial",
    },
    {
      icon: FileText,
      title: "Lập hóa đơn",
      description: "Tạo và quản lý hóa đơn cho các hộ dân",
      gradient: "from-purple-500 to-purple-600",
      shadowColor: "shadow-purple-500/50",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER],
      path: "/bills",
    },
    {
      icon: Wrench,
      title: "Quản lý sửa chữa",
      description: "Theo dõi và xử lý các yêu cầu sửa chữa, bảo trì",
      gradient: "from-orange-500 to-orange-600",
      shadowColor: "shadow-orange-500/50",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER],
      path: "/maintenance",
    },
    {
      icon: Building2,
      title: "Thông tin chung cư",
      description: "Cập nhật thông tin về tòa nhà và tiện ích",
      gradient: "from-cyan-500 to-cyan-600",
      shadowColor: "shadow-cyan-500/50",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER],
      path: "/building-info",
    },
    {
      icon: Car,
      title: "Quản lý xe",
      description: "Đăng ký và quản lý phương tiện giao thông",
      gradient: "from-pink-500 to-pink-600",
      shadowColor: "shadow-pink-500/50",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER],
      path: "/vehicles",
    },
    {
      icon: Clipboard,
      title: "Danh sách công việc",
      description: "Lập kế hoạch và theo dõi tiến độ công việc",
      gradient: "from-indigo-500 to-indigo-600",
      shadowColor: "shadow-indigo-500/50",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER],
    },
    {
      icon: MessageSquare,
      title: "Thông báo - Góp ý",
      description: "Gửi thông báo và tiếp nhận phản hồi từ cư dân",
      gradient: "from-teal-500 to-teal-600",
      shadowColor: "shadow-teal-500/50",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER],
    },
    {
      icon: UserCog,
      title: "Quản lý nhân viên",
      description: "Quản lý thông tin và phân công nhân viên",
      gradient: "from-red-500 to-red-600",
      shadowColor: "shadow-red-500/50",
      requiredRoles: [UserRole.ADMIN],
    },
    {
      icon: ShieldCheck,
      title: "Phân quyền",
      description: "Thiết lập quyền truy cập cho các vai trò",
      gradient: "from-yellow-500 to-yellow-600",
      shadowColor: "shadow-yellow-500/50",
      requiredRoles: [UserRole.ADMIN],
    },
  ];

  const quickStats = [
    {
      icon: HomeIcon,
      label: "Tổng số căn hộ",
      value: "248",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: Users,
      label: "Số cư dân",
      value: "235",
      gradient: "from-green-500 to-green-600",
    },
    {
      icon: Clock,
      label: "Yêu cầu chờ xử lý",
      value: "12",
      gradient: "from-orange-500 to-orange-600",
    },
    {
      icon: DollarSign,
      label: "Thu nhập tháng này",
      value: "1.2 tỷ",
      gradient: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-72">
          <Header />
          
          <main className="flex-1 overflow-y-auto p-6">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                Chào mừng {user?.fullName || 'bạn'} đến với BlueMoon
              </h1>
              <p className="text-slate-400">
                Hệ thống quản lý chung cư thông minh và hiện đại
                {user?.role === UserRole.ADMIN && " - Quản trị viên"}
                {user?.role === UserRole.MANAGER && " - Quản lý"}
                {user?.role === UserRole.USER && user?.apartmentNumber && ` - Căn hộ ${user.apartmentNumber}`}
              </p>
            </div>

            {/* Activity Statistics Section (Admin/Manager only) */}
            {hasPermission([UserRole.ADMIN, UserRole.MANAGER]) && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-blue-400" />
                    Thống kê hoạt động
                  </h2>
                  <button
                    onClick={() => router.push("/activity-logs")}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Xem tất cả →
                  </button>
                </div>

                {loadingStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-slate-800 rounded-xl p-6 border border-slate-700 animate-pulse">
                        <div className="h-12 w-12 bg-slate-700 rounded-lg mb-4"></div>
                        <div className="h-4 bg-slate-700 rounded w-20 mb-2"></div>
                        <div className="h-8 bg-slate-700 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : activityStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Total Activities */}
                    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-blue-500/20 transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Tổng hoạt động</p>
                          <p className="text-3xl font-bold text-slate-100">{activityStats.total}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
                          <Activity className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Successful Activities */}
                    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-green-500/20 transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Thành công</p>
                          <p className="text-3xl font-bold text-green-400">{activityStats.byStatus?.success || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Failed Activities */}
                    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-red-500/20 transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Thất bại</p>
                          <p className="text-3xl font-bold text-red-400">{activityStats.byStatus?.failure || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-3">
                          <XCircle className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Warning Activities */}
                    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-orange-500/20 transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Cảnh báo</p>
                          <p className="text-3xl font-bold text-orange-400">{activityStats.byStatus?.warning || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Recent Activity by Type */}
                {activityStats && activityStats.byAction && (
                  <div className="mt-4 bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-lg">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Hoạt động theo loại</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(activityStats.byAction)
                        .filter(([action]) => {
                          // Filter out actions that are just UUIDs or contain UUIDs
                          const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
                          return !uuidPattern.test(action);
                        })
                        .slice(0, 8)
                        .map(([action, count]) => {
                          // Format action name
                          const formatActionName = (name: string) => {
                            // Remove underscores and capitalize properly
                            return name
                              .split('_')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                              .join(' ');
                          };

                          // Get color based on action type
                          const getActionColor = (name: string) => {
                            const lowerName = name.toLowerCase();
                            if (lowerName.includes('create')) return 'from-green-500 to-green-600';
                            if (lowerName.includes('update') || lowerName.includes('edit')) return 'from-blue-500 to-blue-600';
                            if (lowerName.includes('delete') || lowerName.includes('remove')) return 'from-red-500 to-red-600';
                            if (lowerName.includes('login') || lowerName.includes('auth')) return 'from-purple-500 to-purple-600';
                            if (lowerName.includes('view') || lowerName.includes('read')) return 'from-cyan-500 to-cyan-600';
                            return 'from-gray-500 to-gray-600';
                          };

                          return (
                            <div key={action} className="relative group">
                              <div className="flex flex-col p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 hover:shadow-md transition-all duration-300">
                                <div className={`w-10 h-10 bg-gradient-to-br ${getActionColor(action)} rounded-lg flex items-center justify-center mb-3 shadow-sm`}>
                                  <span className="text-white font-bold text-lg">{count as number}</span>
                                </div>
                                <span className="text-sm font-medium text-slate-300">
                                  {formatActionName(action)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Function Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {functionCards
              .filter((card) => hasPermission(card.requiredRoles))
              .map((card, index) => (
              <button
                key={index}
                onClick={() => {
                  if (card.path) router.push(card.path);
                }}
                className="group relative bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 text-left overflow-hidden"
              >
                {/* Background Glow Effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />

                {/* Icon */}
                <div className={`relative bg-gradient-to-br ${card.gradient} rounded-xl p-4 w-fit mb-4 shadow-lg ${card.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className="w-7 h-7 text-white" />
                </div>

                {/* Title */}
                <h3 className="relative text-xl font-bold text-slate-200 mb-2 group-hover:text-blue-400 transition-colors">
                  {card.title}
                </h3>

                {/* Description */}
                <p className="relative text-slate-400 text-sm leading-relaxed">
                  {card.description}
                </p>

                {/* Hover Arrow */}
                <div className="relative mt-4 flex items-center text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-medium">Xem chi tiết</span>
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}
