"use client";

import { Building2, Home, Users, MapPin } from "lucide-react";
import Link from "next/link";

interface ApartmentCardProps {
  id: string;
  apartment_number: string;
  floor: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  status: "occupied" | "vacant" | "maintenance";
  owner_name?: string;
}

export default function ApartmentCard({
  id,
  apartment_number,
  floor,
  area,
  bedrooms,
  bathrooms,
  status,
  owner_name,
}: ApartmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "occupied":
        return "bg-green-100 text-green-700 border-green-300";
      case "vacant":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "maintenance":
        return "bg-orange-100 text-orange-700 border-orange-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <Link href={`/apartment/${id}`}>
      <div className="group bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg hover:shadow-2xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-3 shadow-md">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                {apartment_number}
              </h3>
              <p className="text-sm text-slate-500">Floor {floor}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border-2 ${getStatusColor(
              status
            )}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">{area} m²</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {bedrooms} bed • {bathrooms} bath
            </span>
          </div>
          {owner_name && (
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{owner_name}</span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-200">
          <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}

