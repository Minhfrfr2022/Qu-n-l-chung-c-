"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/auth";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  Building2,
  ArrowLeft,
  Edit,
  Home,
  Users,
  MapPin,
  Phone,
  Calendar,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Apartment {
  id: string;
  apartment_number: string;
  floor: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  status: "occupied" | "vacant" | "maintenance";
  owner_name?: string;
  owner_phone?: string;
  created_at: string;
}

export default function ApartmentDetailsPage() {
  const params = useParams();
  const apartmentId = params.id as string;
  const { user: currentUser } = useAuth();
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchApartment = async () => {
      try {
        setLoading(true);
        setError("");
        // TODO: Replace with actual API call
        // const response = await apartmentAPI.getById(apartmentId);
        // setApartment(response.apartment);
        
        // Mock data for now
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } catch (err: any) {
        setError(err.message || "Failed to fetch apartment details");
        setLoading(false);
      }
    };

    if (apartmentId) {
      fetchApartment();
    }
  }, [apartmentId]);

  const getStatusBadge = (status: string) => {
    const styles = {
      occupied: "bg-green-100 text-green-700 border-green-300",
      vacant: "bg-blue-100 text-blue-700 border-blue-300",
      maintenance: "bg-orange-100 text-orange-700 border-orange-300",
    };
    return styles[status as keyof typeof styles] || styles.vacant;
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
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="text-slate-600 font-medium">Loading apartment details...</p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !apartment) {
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
                    <Building2 className="w-12 h-12 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Apartment Not Found</h2>
                  <p className="text-slate-600 mb-6">{error || "The apartment you're looking for doesn't exist."}</p>
                  <Link
                    href="/apartment"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Apartments
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
              href="/apartment"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Apartments</span>
            </Link>

            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 shadow-lg">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {apartment.apartment_number}
                    </h1>
                    <p className="text-slate-600 mt-1">Apartment Details</p>
                  </div>
                </div>
                {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER) && (
                  <button className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold">
                    <Edit className="w-5 h-5" />
                    Edit Apartment
                  </button>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info Card */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-xl">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Apartment Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 rounded-xl p-3">
                      <Home className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 mb-1">Apartment Number</p>
                      <p className="text-lg font-bold text-slate-800">{apartment.apartment_number}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-purple-100 rounded-xl p-3">
                      <MapPin className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 mb-1">Floor</p>
                      <p className="text-lg font-bold text-slate-800">Floor {apartment.floor}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 rounded-xl p-3">
                      <MapPin className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 mb-1">Area</p>
                      <p className="text-lg font-bold text-slate-800">{apartment.area} m²</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-orange-100 rounded-xl p-3">
                      <Building2 className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 mb-1">Rooms</p>
                      <p className="text-lg font-bold text-slate-800">
                        {apartment.bedrooms} Bedrooms • {apartment.bathrooms} Bathrooms
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-slate-100 rounded-xl p-3">
                      <Calendar className="w-6 h-6 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 mb-1">Created At</p>
                      <p className="text-lg font-bold text-slate-800">
                        {new Date(apartment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Owner Card */}
              <div className="space-y-6">
                {/* Status Card */}
                <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-xl">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Status</h3>
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border-2 ${getStatusBadge(
                      apartment.status
                    )}`}
                  >
                    {apartment.status.charAt(0).toUpperCase() + apartment.status.slice(1)}
                  </span>
                </div>

                {/* Owner Card */}
                {apartment.owner_name && (
                  <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-xl">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Owner Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 rounded-xl p-2">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Owner Name</p>
                          <p className="font-bold text-slate-800">{apartment.owner_name}</p>
                        </div>
                      </div>
                      {apartment.owner_phone && (
                        <div className="flex items-start gap-3">
                          <div className="bg-green-100 rounded-xl p-2">
                            <Phone className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Phone</p>
                            <p className="font-bold text-slate-800">{apartment.owner_phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

