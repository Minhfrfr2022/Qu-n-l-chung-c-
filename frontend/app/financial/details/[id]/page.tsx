"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/auth";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  DollarSign,
  ArrowLeft,
  Edit,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Tag,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface FinancialRecord {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
  created_by: string;
  created_at: string;
}

export default function FinancialDetailsPage() {
  const params = useParams();
  const recordId = params.id as string;
  const { user: currentUser } = useAuth();
  const [record, setRecord] = useState<FinancialRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true);
        setError("");
        // TODO: Replace with actual API call
        // const response = await financialAPI.getById(recordId);
        // setRecord(response.record);
        
        // Mock data for now
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } catch (err: any) {
        setError(err.message || "Failed to fetch financial record");
        setLoading(false);
      }
    };

    if (recordId) {
      fetchRecord();
    }
  }, [recordId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]}>
        <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100">
          <Sidebar />
          <div className="ml-72 mr-4">
            <Header />
            <main className="p-6">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                  <p className="text-slate-600 font-medium">Loading financial record...</p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !record) {
    return (
      <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]}>
        <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100">
          <Sidebar />
          <div className="ml-72 mr-4">
            <Header />
            <main className="p-6">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="bg-red-100 rounded-full p-4 w-fit mx-auto mb-4">
                    <DollarSign className="w-12 h-12 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Record Not Found</h2>
                  <p className="text-slate-600 mb-6">{error || "The financial record you're looking for doesn't exist."}</p>
                  <Link
                    href="/financial"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Financial Records
                  </Link>
                </div>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]}>
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100">
        <Sidebar />
        <div className="ml-72 mr-4">
          <Header />

          <main className="p-6">
            {/* Back Button */}
            <Link
              href="/financial"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-green-600 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Financial Records</span>
            </Link>

            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className={`rounded-2xl p-4 shadow-lg ${
                    record.type === "income"
                      ? "bg-gradient-to-br from-green-500 to-emerald-600"
                      : "bg-gradient-to-br from-red-500 to-rose-600"
                  }`}>
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className={`text-4xl font-bold bg-clip-text text-transparent ${
                      record.type === "income"
                        ? "bg-gradient-to-r from-green-600 to-emerald-600"
                        : "bg-gradient-to-r from-red-600 to-rose-600"
                    }`}>
                      {record.category}
                    </h1>
                    <p className="text-slate-600 mt-1">Financial Record Details</p>
                  </div>
                </div>
                {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER) && (
                  <button className={`group flex items-center gap-2 px-6 py-3 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold ${
                    record.type === "income"
                      ? "bg-gradient-to-r from-green-600 to-emerald-600"
                      : "bg-gradient-to-r from-red-600 to-rose-600"
                  }`}>
                    <Edit className="w-5 h-5" />
                    Edit Record
                  </button>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info Card */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-xl">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Record Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-xl p-3 ${
                      record.type === "income" ? "bg-green-100" : "bg-red-100"
                    }`}>
                      {record.type === "income" ? (
                        <TrendingUp className={`w-6 h-6 ${record.type === "income" ? "text-green-600" : "text-red-600"}`} />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 mb-1">Type</p>
                      <p className={`text-lg font-bold ${
                        record.type === "income" ? "text-green-700" : "text-red-700"
                      }`}>
                        {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-purple-100 rounded-xl p-3">
                      <Tag className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 mb-1">Category</p>
                      <p className="text-lg font-bold text-slate-800">{record.category}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={`rounded-xl p-3 ${
                      record.type === "income" ? "bg-green-100" : "bg-red-100"
                    }`}>
                      <DollarSign className={`w-6 h-6 ${
                        record.type === "income" ? "text-green-600" : "text-red-600"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 mb-1">Amount</p>
                      <p className={`text-2xl font-bold ${
                        record.type === "income" ? "text-green-600" : "text-red-600"
                      }`}>
                        {record.type === "income" ? "+" : "-"}
                        {formatCurrency(record.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 rounded-xl p-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 mb-1">Description</p>
                      <p className="text-lg font-bold text-slate-800">{record.description}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-slate-100 rounded-xl p-3">
                      <Calendar className="w-6 h-6 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 mb-1">Date</p>
                      <p className="text-lg font-bold text-slate-800">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Info Card */}
              <div className="space-y-6">
                {/* Created By Card */}
                <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-xl">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Created By</h3>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-xl p-2">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Created By</p>
                      <p className="font-bold text-slate-800">{record.created_by}</p>
                    </div>
                  </div>
                </div>

                {/* Created At Card */}
                <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-xl">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Record Date</h3>
                  <div className="flex items-start gap-3">
                    <div className="bg-slate-100 rounded-xl p-2">
                      <Calendar className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Created At</p>
                      <p className="font-bold text-slate-800">
                        {new Date(record.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(record.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

