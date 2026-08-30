"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full shadow-lg mb-6">
          <ShieldAlert className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Không có quyền truy cập
        </h1>
        
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn cần được cấp quyền.
        </p>
        
        <div className="space-x-4">
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Về trang chủ
          </Link>
          
          <Link
            href="/login"
            className="inline-block bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl"
          >
            Đăng nhập lại
          </Link>
        </div>
      </div>
    </div>
  );
}
