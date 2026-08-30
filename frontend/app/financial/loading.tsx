import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50/50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        <p className="text-lg font-medium text-gray-600 animate-pulse">
          Đang tải dữ liệu tài chính...
        </p>
      </div>
    </div>
  );
}

