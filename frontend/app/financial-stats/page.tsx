"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/auth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/bills/components/ui/tabs";
import { BarChart3 } from "lucide-react";
import RevenueManagement from "./components/RevenueManagement";
import DebtControl from "./components/DebtControl";
import SettlementReport from "./components/SettlementReport";

export default function FinancialStatsPage() {
  const [activeTab, setActiveTab] = useState("revenue");

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Sidebar />
        <div className="ml-72 mr-4">
          <Header />
          <main className="p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 shadow-lg">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                      Thống kê tài chính
                    </h1>
                    <p className="text-slate-400 mt-1">
                      Quản lý doanh thu, kiểm soát nợ và báo cáo quyết toán
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-slate-800 border border-slate-700 p-1 grid w-full grid-cols-3 lg:w-[600px]">
                  <TabsTrigger value="revenue" className="text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400">
                    📈 Quản lý doanh thu
                  </TabsTrigger>
                  <TabsTrigger value="debt" className="text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400">
                    ⚠️ Kiểm soát nợ đọng
                  </TabsTrigger>
                  <TabsTrigger value="settlement" className="text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400">
                    📊 Báo cáo quyết toán
                  </TabsTrigger>
                </TabsList>

                {/* Module 3.1: Quản lý doanh thu */}
                <TabsContent value="revenue">
                  <RevenueManagement />
                </TabsContent>

                {/* Module 3.2: Kiểm soát nợ đọng */}
                <TabsContent value="debt">
                  <DebtControl />
                </TabsContent>

                {/* Module 3.3: Báo cáo quyết toán */}
                <TabsContent value="settlement">
                  <SettlementReport />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
