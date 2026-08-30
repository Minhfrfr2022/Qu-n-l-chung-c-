"use client"

import { useEffect, useState } from "react"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { RequestsTab } from "../components/vehicles/requests-tab"
import { SearchTab } from "../components/vehicles/search-tab"
import { AppHeader } from "../components/app-header"
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import BackButton from "../../../components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import { Card } from "../components/ui/card";
import { Plus, Car, Bike } from "lucide-react"
import { vehicle_type } from "../../helper/type";
import {ApiCall} from "../../helper/api";

const vehicleStats = {
  car: 1,
  motorbike: 1,
  bike: 0,
}

export default function AdminVehiclePage() {
  const api = new ApiCall();

  const { user } = useAuth();
  const [stats, setStats] = useState<vehicle_type>({
    cars: 0,
    bikes: 0,
    motorbikes: 0
  });


  const fetchStats = async() => {
    try {
      
      const cars = await api.count_each_type("car");
      const bikes = await api.count_each_type("bike");
      const motorbikes = await api.count_each_type("motorbike");
      console.log(cars);
      console.log(bikes);
      console.log(motorbikes);
      setStats({
        cars: cars,
        bikes: bikes,
        motorbikes: motorbikes
      })
    }
    catch(error) {
      console.log("43434");
      console.log(error);
    }
  }

  useEffect(() => {
    fetchStats();
  },[])

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-72">
        <Header />
        
        <main className="container mx-auto px-6 py-8 space-y-8">
          {/* Back Button */}
          <BackButton />
          
          {/* Stats cards */}
        <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-0 text-white p-6 rounded-2xl relative overflow-hidden bg-gradient-to-br from-[#0066FF] to-[#0052CC]">
          {/* Background circle */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8" />
          
          {/* Content */}
          <div className="flex items-center justify-between relative z-10">
            {/* Text */}
            <div>
              <h3 className="text-white/90 text-sm font-medium mb-2">Ô tô</h3>
              <div className="text-5xl font-bold mb-1">{stats.cars}</div>
              <p className="text-white/80 text-sm">xe đang hoạt động</p>
            </div>

            {/* Icon */}
            <div className="bg-white/20 p-4 rounded-xl flex items-center justify-center">
              <Car className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>


          <Card className="border-0 text-white p-6 rounded-2xl relative overflow-hidden bg-gradient-to-br from-[#00C853] to-[#00A843]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <h3 className="text-white/90 text-sm font-medium mb-3">Xe máy</h3>
                <div className="text-5xl font-bold mb-1">{stats.motorbikes}</div>
                <p className="text-white/80 text-sm">xe đang hoạt động</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <Bike className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="border-0 text-white p-6 rounded-2xl relative overflow-hidden bg-gradient-to-br from-[#9C27B0] to-[#7B1FA2]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <h3 className="text-white/90 text-sm font-medium mb-3">Xe đạp</h3>
                <div className="text-5xl font-bold mb-1">{stats.bikes}</div>
                <p className="text-white/80 text-sm">xe đang hoạt động</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <Bike className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Tabs defaultValue="requests" className="space-y-6">
            <TabsList className="bg-slate-900 border border-slate-800">
              <TabsTrigger value="requests" className="data-[state=active]:bg-slate-800">
                Yêu cầu đăng ký
              </TabsTrigger>
              <TabsTrigger value="search" className="data-[state=active]:bg-slate-800">
                Tìm kiếm xe
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-4">
              <RequestsTab />
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <SearchTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      </div>
    </div>
  )
}
