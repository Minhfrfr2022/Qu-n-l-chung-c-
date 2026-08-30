"use client"

import { useState } from "react"
import { Button } from "./components/ui/button"
import { cn } from "@/lib/utils"
import { UserBillsView } from "./details/user-bills-view";
import { AdminBillsView } from "./details/admin-bills-view"
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import Header from "../../components/Header";
import { useEffect } from "react";
import { Loader2 } from "lucide-react"

export default function BillsPage() {
  const { user } = useAuth();


  if(user && user.role)  return ( user?.role === UserRole.USER) ? <UserBillsView /> : <AdminBillsView />


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
