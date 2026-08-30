'use client';

import UserVehiclePage from "./user/UserView";
import AdminVehiclePage from "./admin/AdminView";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import Header from "../../components/Header";
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function VehiclePage() {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if(user && user.role) {
      setIsLoading(false);
    }
    else {
      setIsLoading(true);
    }
  }, [user]);

  if(!isLoading && user?.role === UserRole.ADMIN) {
    return <AdminVehiclePage />
  }

  if(!isLoading && user?.role === UserRole.USER) {
    return <UserVehiclePage />
  }
  return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          {/* Icon xoay animate-spin */}
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-lg font-medium text-gray-600 animate-pulse">
            Đang tải dữ liệu hóa đơn...
          </p>
        </div>
      </div>
    );
}
