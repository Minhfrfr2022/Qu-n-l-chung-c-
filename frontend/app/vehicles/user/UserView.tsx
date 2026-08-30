"use client"
import axios from "axios";
import type React from "react"
import { use, useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Plus, Car, Bike } from "lucide-react"
import { AppHeader } from "../components/app-header"
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import BackButton from "../../../components/BackButton";
import { vehicle_type } from "../../helper/type";
import {ApiCall} from "../../helper/api";
import { useAuth } from "@/contexts/AuthContext";
import { ca } from "date-fns/locale";


const vehicleTypeLabels: Record<string, string> = {
  car: "Ô tô",
  motorbike: "Xe máy",
  bike: "Xe đạp",
}

export default function UserVehiclePage() {
  /// use state
  const { user } = useAuth();
  const api = new ApiCall();
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    licensePlate: "",
    type: "",
    color: "",
    owner: "",
  })
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorFetch, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<vehicle_type>({
    cars: 0,
    bikes: 0,
    motorbikes: 0
  });

  const [isInMode, setInMode] = useState<boolean>(false);

  // load request
  const [isLoadingRequest, setLoadingRequest] = useState(true);
  const [errorFetchRequest, setErrorFetchRequest] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);

  /// util function
  const fetchUserStats = async() => {
    try {
      const apt_id = user?.apartmentNumber;
      if(apt_id === null) throw new Error("No apt found");
      const cars = await api.count_each_type_with_apt(apt_id, "car");
      const bikes = await api.count_each_type_with_apt(apt_id, "bike");
      const motorbikes = await api.count_each_type_with_apt(apt_id, "motorbike");
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

  const fetchUserVehicles = async() => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.query_vehicles_by_apt(user?.apartmentNumber);
      console.log("232322: ", res.data.vehicle_list);
      setVehicles(res.data.vehicle_list);
    }
    catch(error) {
      setError(error.message);
      console.log("Fetch err: ", error);
    } finally {
      setIsLoading(false);
    }
  }

  const fetchUserRequest = async() => {
    setLoadingRequest(true);
    setErrorFetchRequest(null);
    try {
      
      console.log(user?.apartmentNumber);
      const res = await api.query_request_by_apt(user?.apartmentNumber);
      console.log("helloo");
      console.log(res.data.request_list);
      setRequests(res.data.request_list);
    }
    catch(error) {
      setError(error.message);
      console.log("Fetch err: ", error);
    } finally {
      setLoadingRequest(false);
    }
  }

  const sendNewRequest = async() => {
    try {
      const apt_id = user?.apartmentNumber;
      const number = formData.licensePlate;
      const owner = formData.owner;
      const type = formData.type;
      const color = formData.color;
      const created_by = user?.id;
      
      console.log("Sending request:", { apt_id, number, owner, type, color, created_by });
      
      if (!apt_id || !number || !owner || !type || !color) {
        throw new Error("Vui lòng điền đầy đủ thông tin");
      }
      
      const res = await api.request_new_vehicle(apt_id, number, type, color, owner, created_by);
      console.log("API response:", res);
      return res;
    }
    catch(error) {
      console.error("sendNewRequest error:", error);
      throw new Error(error.message || "Không thể gửi yêu cầu");
    }
  }

  useEffect(() => {
    console.log(user?.apartmentNumber);
    console.log("resssssss");
    if(user && user.apartmentNumber)
      fetchUserVehicles();
    console.log("Stats vừa cập nhật:", stats);
  }, [user]);

  useEffect(() => {
    if(user && user.apartmentNumber) {
      console.log("user info", user);
      fetchUserStats();
    }
    else {
      console.log("no user info found")
    }
  }, [user]);

  useEffect(() => {
    //fetchUserStats();
    console.log("Stats vừa cập nhật:", stats);
  }, [stats]);

  useEffect(() => {
    console.log("FORM");
    console.log(formData);
  }, [formData])

  useEffect(() => {
    if(user && user.apartmentNumber) {
      fetchUserRequest();
    }
  }, [user])

  
  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault()
    setInMode(true);
    console.log("[v0] Form submitted:", formData)
    
    if(!user || !user.apartmentNumber) {
      console.error("No user or apartment number");
      alert("Vui lòng đăng nhập lại!");
      setInMode(false);
      return;
    }
    
    console.log("User info:", user);
    try {
      const result = await sendNewRequest();
      console.log("Submit result:", result);
      
      // Success! Close dialog and reset form
      setOpen(false);
      setFormData({
        licensePlate: "",
        type: undefined,
        color: "",
        owner: "",
      });
      
      // Refresh the request list
      await fetchUserRequest();
      setInMode(false);
      
      // Show success message
      alert("Đăng ký xe thành công! Vui lòng đợi ban quản trị xác nhận.");
    }
    catch(error) {
      console.error("Submit error:", error);
      alert("Lỗi: " + (error.message || "Không thể gửi yêu cầu"));
      setInMode(false);
    }
  }

  /// return 

 return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-72">
        <Header />

        <main className="container mx-auto px-6 py-8 space-y-6">
          {/* Back Button */}
          <BackButton />
          
          {/* Stats cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-0 text-white p-6 rounded-2xl relative overflow-hidden bg-gradient-to-br from-[#0066FF] to-[#0052CC]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <h3 className="text-white/90 text-sm font-medium mb-3">Ô tô</h3>
                <div className="text-5xl font-bold mb-1">{stats.cars}</div>
                <p className="text-white/80 text-sm">xe đang hoạt động</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <Car className="h-6 w-6 text-white" />
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
        {/* <Button onClick={fetchUserRequest} variant="link" className="ml-2 bg-blue-700">
                      Reload
                  </Button> */}
        

        {/* Vehicle list: Mở một tab mới nhưng là nó nhỏ hơn */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Danh sách xe của bạn</h2>
            <Dialog open={open} onOpenChange={setOpen}> 
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Đăng ký xe mới
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white border-gray-200">
                <DialogHeader>
                  <DialogTitle className="text-gray-900">Đăng ký xe mới</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Điền thông tin xe để gửi yêu cầu đăng ký đến ban quản lý
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="licensePlate" className="text-gray-700">
                      Biển số xe
                    </Label>
                    <Input
                      id="licensePlate"
                      placeholder="VD: 29A-12345"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                      className="bg-white border-gray-300 text-gray-900"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-gray-700">
                      Loại xe
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                      required
                    >
                      <SelectTrigger id="type" className="bg-white border-gray-300 text-gray-900">
                        <SelectValue placeholder="Chọn loại xe" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-300">
                        <SelectItem value="car">Ô tô</SelectItem>
                        <SelectItem value="motorbike">Xe máy</SelectItem>
                        <SelectItem value="bike">Xe đạp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-gray-700">
                      Màu sắc
                    </Label>
                    <Input
                      id="color"
                      placeholder="VD: Đen, Trắng, Đỏ"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="bg-white border-gray-300 text-gray-900"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner" className="text-gray-700">
                      Chủ sở hữu
                    </Label>
                    <Input
                      id="owner"
                      placeholder="Họ và tên"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      className="bg-white border-gray-300 text-gray-900"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-gray-300">
                      Hủy
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isInMode}>
                      {isInMode ? "Đang gửi..." : "Gửi yêu cầu"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading && (
                <Card className="p-6 text-center text-blue-600">
                    Đang tải danh sách xe...
                </Card>
          )}

          {errorFetch && !isLoading && (
                <Card className="p-6 text-center text-red-600 border-red-200 bg-red-50">
                    Lỗi: {errorFetch}
                    <Button onClick={fetchUserVehicles} variant="link" className="ml-2">
                        Thử lại
                    </Button>
                </Card>
          )}


          { !isLoading && !errorFetch && (
              <Card className="bg-white border-gray-200">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow className="border-gray-200 hover:bg-gray-50">
                      <TableHead className="text-gray-600">Biển số xe</TableHead>
                      <TableHead className="text-gray-600">Loại xe</TableHead>
                      <TableHead className="text-gray-600">Màu sắc</TableHead>
                      <TableHead className="text-gray-600">Chủ sở hữu</TableHead>
                      <TableHead className="text-gray-600">Căn hộ</TableHead>
                      <TableHead className="text-gray-600">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle) => (
                      <TableRow key={vehicle.number} className="border-gray-200 hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">{vehicle.number}</TableCell>
                        <TableCell className="text-gray-700">{vehicleTypeLabels[vehicle.type]}</TableCell>
                        <TableCell className="text-gray-700">{vehicle.color}</TableCell>
                        <TableCell className="text-gray-700">{vehicle.owner}</TableCell>
                        <TableCell className="text-gray-700">{vehicle.apt_id}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-600 hover:bg-green-600 text-white border-0">Đang hoạt động</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                  {vehicles.length === 0 && (
                        <div className="p-6 text-center text-gray-500">
                            Bạn chưa đăng ký phương tiện nào.
                        </div>
                  )}
              </Card>
          )}

          {isLoadingRequest && (
                <Card className="p-6 text-center text-blue-600">
                    Đang tải danh sách yêu cầu...
                </Card>
          )}
          {errorFetchRequest && !isLoadingRequest && (
                <Card className="p-6 text-center text-red-600 border-red-200 bg-red-50">
                    Lỗi: {errorFetch}
                    <Button onClick={fetchUserVehicles} variant="link" className="ml-2">
                        Thử lại
                    </Button>
                </Card>
          )}
          {!isLoadingRequest && !errorFetchRequest && (
              <Card className="bg-white border-gray-200">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow className="border-gray-200 hover:bg-gray-50">
                      <TableHead className="text-gray-600">Biển số xe</TableHead>
                      <TableHead className="text-gray-600">Loại xe</TableHead>
                      <TableHead className="text-gray-600">Màu sắc</TableHead>
                      <TableHead className="text-gray-600">Chủ sở hữu</TableHead>
                      <TableHead className="text-gray-600">Căn hộ</TableHead>
                      <TableHead className="text-gray-600">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => {
                      const getStatusBadge = (status: string) => {
                        switch(status) {
                          case 'approved':
                            return <Badge className="bg-green-600 hover:bg-green-600 text-white border-0">Đã duyệt</Badge>;
                          case 'rejected':
                            return <Badge className="bg-red-600 hover:bg-red-600 text-white border-0">Đã từ chối</Badge>;
                          default:
                            return <Badge className="bg-yellow-600 hover:bg-yellow-600 text-white border-0">Đang chờ</Badge>;
                        }
                      };
                      
                      return (
                        <TableRow key={request.number} className="border-gray-200 hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">{request.number}</TableCell>
                          <TableCell className="text-gray-700">{vehicleTypeLabels[request.type]}</TableCell>
                          <TableCell className="text-gray-700">{request.color}</TableCell>
                          <TableCell className="text-gray-700">{request.owner}</TableCell>
                          <TableCell className="text-gray-700">{request.apt_id}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {getStatusBadge(request.status || 'pending')}
                              {request.status === 'rejected' && request.rejection_reason && (
                                <div className="text-xs text-red-600 mt-1">
                                  Lý do: {request.rejection_reason}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                  {requests.length === 0 && (
                        <div className="p-6 text-center text-gray-500">
                            Bạn không có yêu cầu đăng ký xe nào.
                        </div>
                  )}
              </Card>
          )}
        </div>
      </main>
      </div>
    </div>
  )
}
