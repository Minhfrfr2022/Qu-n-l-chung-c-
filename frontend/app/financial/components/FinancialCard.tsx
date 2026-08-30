"use client";

import { DollarSign, TrendingUp, TrendingDown, Calendar, FileText } from "lucide-react";
import Link from "next/link";

interface FinancialCardProps {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
}

export default function FinancialCard({
  id,
  type,
  category,
  amount,
  description,
  date,
}: FinancialCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <Link href={`/financial/details/${id}`}>
      <div className={`group bg-white rounded-2xl p-6 border-2 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
        type === "income"
          ? "border-green-200 hover:border-green-300"
          : "border-red-200 hover:border-red-300"
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-3 shadow-md ${
              type === "income"
                ? "bg-gradient-to-br from-green-500 to-emerald-600"
                : "bg-gradient-to-br from-red-500 to-rose-600"
            }`}>
              {type === "income" ? (
                <TrendingUp className="w-6 h-6 text-white" />
              ) : (
                <TrendingDown className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className={`text-xl font-bold group-hover:transition-colors ${
                type === "income" ? "text-green-700 group-hover:text-green-800" : "text-red-700 group-hover:text-red-800"
              }`}>
                {category}
              </h3>
              <p className="text-sm text-slate-500">{new Date(date).toLocaleDateString()}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border-2 ${
              type === "income"
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-red-100 text-red-700 border-red-300"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-slate-600">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium line-clamp-2">{description}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className={`w-4 h-4 ${
              type === "income" ? "text-green-600" : "text-red-600"
            }`} />
            <span className={`text-lg font-bold ${
              type === "income" ? "text-green-600" : "text-red-600"
            }`}>
              {type === "income" ? "+" : "-"}
              {formatCurrency(amount)}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <span className={`text-sm font-medium group-hover:transition-colors ${
            type === "income" ? "text-green-600 group-hover:text-green-700" : "text-red-600 group-hover:text-red-700"
          }`}>
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}

