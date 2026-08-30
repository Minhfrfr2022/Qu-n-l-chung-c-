"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="text-sm font-medium">Quay lại</span>
    </button>
  );
}
