"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import { ActivityLog, ActivityLogFilters } from "@/types/activityLog";
import { getActivityLogs, getMyActivityLogs } from "@/helper/activityLogApi";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import BackButton from "@/components/BackButton";
import ProtectedRoute from "@/components/ProtectedRoute";
import { 
  Loader2, 
  Search, 
  Filter, 
  Download, 
  Activity,
  RefreshCw,
  Eye,
  X,
  TrendingUp,
  FileText,
  AlertCircle,
  BarChart3
} from "lucide-react";

export default function ActivityLogsPage() {
  return (
    <ProtectedRoute>
      <ActivityLogsContent />
    </ProtectedRoute>
  );
}

function ActivityLogsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ActivityLogFilters>({
    page: 1,
    limit: 50,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  });

  const isAdminOrManager = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, user?.id]);

  const fetchLogs = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = isAdminOrManager
        ? await getActivityLogs(filters)
        : await getMyActivityLogs(filters);

      setLogs(response.logs);
      setPagination(response.pagination);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch activity logs";
      
      // If 401 (Unauthorized), redirect to login
      if (errorMessage.includes("401")) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }
      
      // If 403 (Forbidden), show unauthorized message
      if (errorMessage.includes("403")) {
        setError("Bạn không có quyền truy cập tính năng này. Vui lòng liên hệ quản trị viên.");
        alert("Bạn không có quyền truy cập nhật ký hoạt động.");
        return;
      }
      
      setError(errorMessage);
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ActivityLogFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failure":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("delete")) return "text-red-600";
    if (action.includes("create")) return "text-green-600";
    if (action.includes("update")) return "text-blue-600";
    return "text-gray-600";
  };

  const handleExport = () => {
    const csv = [
      ["Date & Time", "User", "Action", "Resource", "Status", "IP Address"].join(","),
      ...logs.map(log => [
        formatDate(log.created_at),
        log.username,
        log.action,
        log.resource_type,
        log.status,
        log.ip_address || "N/A"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 50 });
  };

  if (!user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50/50 dark:bg-slate-900/50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mt-4">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Sidebar />
      <div className="ml-72 p-6">
        <Header />
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Back Button */}
          <BackButton />
          
          {/* Page Title */}
          <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Activity className="h-7 w-7 text-blue-600" />
              Nhật ký hoạt động
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isAdminOrManager
                ? "Theo dõi và giám sát tất cả hoạt động hệ thống"
                : "Xem lịch sử hoạt động của bạn"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 text-gray-900 dark:text-gray-100"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Làm mới</span>
            </button>
            {logs.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm font-medium">Xuất CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-blue-500/20 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Tổng hoạt động</p>
                <p className="text-3xl font-bold mt-1">{pagination.total}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="border border-green-500/20 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-lg shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-100">Trang hiện tại</p>
                <p className="text-3xl font-bold mt-1">{pagination.page}/{pagination.totalPages || 1}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="border border-purple-500/20 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-lg shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-100">Hiển thị</p>
                <p className="text-3xl font-bold mt-1">{logs.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Eye className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 mb-6">
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setShowFilters(!showFilters)}
          >
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">Bộ lọc</span>
              {(filters.search || filters.action || filters.resourceType || filters.status) && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  Đang lọc
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {(filters.search || filters.action || filters.resourceType || filters.status) && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearFilters(); }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Xóa bộ lọc
                </button>
              )}
              <span className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>
          </div>
          
          {showFilters && (
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    value={filters.search || ""}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                  />
                </div>

                {isAdminOrManager && (
                  <>
                    {/* Action Filter */}
                    <select
                      className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                      value={filters.action || ""}
                      onChange={(e) => handleFilterChange("action", e.target.value)}
                    >
                      <option value="">Tất cả hành động</option>
                      <option value="login">Đăng nhập</option>
                      <option value="logout">Đăng xuất</option>
                      <option value="users_create">Tạo người dùng</option>
                      <option value="users_update">Cập nhật người dùng</option>
                      <option value="bills_create">Tạo hóa đơn</option>
                      <option value="bills_update">Cập nhật hóa đơn</option>
                      <option value="vehicles_create">Tạo phương tiện</option>
                      <option value="visitors_create">Tạo khách</option>
                    </select>

                    {/* Resource Type Filter */}
                    <select
                      className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                      value={filters.resourceType || ""}
                      onChange={(e) => handleFilterChange("resourceType", e.target.value)}
                    >
                      <option value="">Tất cả tài nguyên</option>
                      <option value="users">Người dùng</option>
                      <option value="bills">Hóa đơn</option>
                      <option value="vehicles">Phương tiện</option>
                      <option value="visitors">Khách</option>
                      <option value="apartments">Căn hộ</option>
                      <option value="payments">Thanh toán</option>
                      <option value="access-cards">Thẻ ra vào</option>
                    </select>
                  </>
                )}

                {/* Status Filter */}
                <select
                  className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                  value={filters.status || ""}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="success">Thành công</option>
                  <option value="failure">Thất bại</option>
                  <option value="warning">Cảnh báo</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex h-64 w-full flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Đang tải nhật ký...</p>
          </div>
        ) : (
          <>
            {/* Logs Table */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Thời gian
                      </th>
                      {isAdminOrManager && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Người dùng
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Hành động
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tài nguyên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      {isAdminOrManager && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          IP
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Chi tiết
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                    {logs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={isAdminOrManager ? 7 : 5}
                          className="px-6 py-12 text-center"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full">
                              <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Không tìm thấy nhật ký nào</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">Thử điều chỉnh bộ lọc của bạn</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            <div className="flex flex-col">
                              <span className="font-medium">{new Date(log.created_at).toLocaleDateString("vi-VN")}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(log.created_at).toLocaleTimeString("vi-VN")}</span>
                            </div>
                          </td>
                          {isAdminOrManager && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                  {log.username?.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{log.username}</span>
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-semibold ${getActionColor(log.action)}`}>
                              {log.action.replace(/_/g, " ").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 dark:text-gray-100">{log.resource_type}</span>
                              {log.resource_id && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ID: {log.resource_id.substring(0, 8)}...
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                log.status
                              )}`}
                            >
                              {log.status === "success" ? "Thành công" : log.status === "failure" ? "Thất bại" : "Cảnh báo"}
                            </span>
                          </td>
                          {isAdminOrManager && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                              {log.ip_address || "N/A"}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                              Xem
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800 shadow-sm">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Hiển thị <span className="font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span> đến{" "}
                  <span className="font-semibold">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{" "}
                  trong tổng <span className="font-semibold">{pagination.total}</span> kết quả
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium ${
                            pagination.page === pageNum
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Details Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl border border-gray-200 dark:border-slate-800">
              <div className="sticky top-0 bg-blue-600 dark:bg-blue-700 text-white p-5 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Chi tiết nhật ký</h3>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Thời gian</label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">{formatDate(selectedLog.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Người dùng</label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">{selectedLog.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Hành động</label>
                    <p className={`mt-1 font-semibold ${getActionColor(selectedLog.action)}`}>
                      {selectedLog.action.replace(/_/g, " ").toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Tài nguyên</label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">{selectedLog.resource_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Trạng thái</label>
                    <p className="mt-1">
                      <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusColor(selectedLog.status)}`}>
                        {selectedLog.status === "success" ? "Thành công" : selectedLog.status === "failure" ? "Thất bại" : "Cảnh báo"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">IP Address</label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1 font-mono text-sm">{selectedLog.ip_address || "N/A"}</p>
                  </div>
                </div>
                {selectedLog.resource_id && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Resource ID</label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1 font-mono text-sm break-all">{selectedLog.resource_id}</p>
                  </div>
                )}
                {selectedLog.user_agent && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">User Agent</label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1 text-sm break-all">{selectedLog.user_agent}</p>
                  </div>
                )}
                {selectedLog.details && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Chi tiết bổ sung</label>
                    <pre className="mt-2 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs overflow-x-auto border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
