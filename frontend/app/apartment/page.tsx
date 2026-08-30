"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/auth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { Badge } from "./components/ui/badge";
import { Building2, Search, Plus, Edit, Trash2, Loader2, RefreshCw } from "lucide-react";
import { apartmentAPI, type Apartment } from "@/lib/apartmentApi";
import { ApartmentDialog } from "./components/apartment-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";

const getStatusBadge = (status?: string) => {
  switch (status) {
    case "occupied":
      return <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm border-0">Đã có người ở</Badge>;
    case "vacant":
      return <Badge className="bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white shadow-sm border-0">Trống</Badge>;
    case "rented":
      return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm border-0">Cho thuê</Badge>;
    default:
      return <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm border-0">-</Badge>;
  }
};

export default function ApartmentPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);

  const itemsPerPage = 10;

  const fetchApartments = async () => {
    setLoading(true);
    try {
      const response = search
        ? await apartmentAPI.search({
            q: search,
            page: currentPage,
            page_size: itemsPerPage,
          })
        : await apartmentAPI.getAll({
            page: currentPage,
            page_size: itemsPerPage,
          });

      setApartments(response?.data ?? []);
      setTotalPages(response?.pagination?.total_pages ?? 1);
    } catch (error: any) {
      console.error("Fetch error:", error.message);
      alert(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when page changes
  useEffect(() => {
    fetchApartments();
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchApartments();
  };

  const handleRefresh = () => {
    setSearch("");
    setCurrentPage(1);
    fetchApartments();
  };

  const handleAdd = () => {
    setSelectedApartment(null);
    setDialogOpen(true);
  };

  const handleEdit = (apartment: Apartment) => {
    setSelectedApartment(apartment);
    setDialogOpen(true);
  };

  const handleDelete = (apartment: Apartment) => {
    setSelectedApartment(apartment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedApartment) {
      try {
        await apartmentAPI.delete(selectedApartment.apt_id);
        setDeleteDialogOpen(false);
        setSelectedApartment(null);
        await fetchApartments();
        alert(`Đã xóa căn hộ ${selectedApartment.apt_id}`);
      } catch (error: any) {
        alert(`Lỗi: ${error.message}`);
      }
    }
  };

  const handleSubmit = async (data: Apartment) => {
    try {
      if (selectedApartment) {
        await apartmentAPI.update(selectedApartment.apt_id, data);
        alert("Đã cập nhật căn hộ thành công");
      } else {
        await apartmentAPI.create(data);
        alert("Đã tạo căn hộ thành công");
      }
      setDialogOpen(false);
      setSelectedApartment(null);
      await fetchApartments();
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Sidebar />
        <div className="ml-72 mr-4">
          <Header />
          <main className="p-6">
            <div className="space-y-6">
              <Card className="border border-slate-700 bg-slate-800/90 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-b-2 border-slate-700 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-xl p-3 shadow-lg">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 text-xl font-bold">Danh sách hộ dân / căn hộ</CardTitle>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Tìm kiếm theo mã căn hộ, tên chủ hộ, số điện thoại..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-9 bg-slate-700 text-slate-100 border-slate-600 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-lg"
                      />
                    </div>
                    <Button onClick={handleSearch} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md text-white">
                      <Search className="h-4 w-4" />
                      Tìm kiếm
                    </Button>
                    <Button onClick={handleRefresh} variant="outline" className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500">
                      <RefreshCw className="h-4 w-4" />
                      Tải lại
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="bg-gradient-to-br from-slate-800 to-slate-900 p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    </div>
                  ) : apartments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">Không có dữ liệu</div>
                  ) : (
                    <>
                      <div className="mb-4 flex justify-end">
                        <Button onClick={handleAdd} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md text-white">
                          <Plus className="h-4 w-4" />
                          Thêm căn hộ
                        </Button>
                      </div>
                      <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg bg-slate-800/50">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b-2 border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-900">
                            <TableHead className="font-bold text-slate-200">Mã căn hộ</TableHead>
                            <TableHead className="font-bold text-slate-200">Tầng</TableHead>
                            <TableHead className="font-bold text-slate-200">Chủ hộ</TableHead>
                            <TableHead className="font-bold text-slate-200">Số điện thoại</TableHead>
                            <TableHead className="font-bold text-slate-200">Trạng thái</TableHead>
                            <TableHead className="text-center font-bold text-slate-200">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {apartments.map((apartment) => (
                            <TableRow key={apartment.apt_id} className="border-b border-slate-700 bg-slate-800 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-800 transition-colors duration-150">
                              <TableCell className="font-semibold text-blue-400">{apartment.apt_id}</TableCell>
                              <TableCell className="text-slate-300">{apartment.floor ? `Tầng ${apartment.floor}` : "-"}</TableCell>
                              <TableCell className="text-slate-100 font-medium">{apartment.owner_name || "-"}</TableCell>
                              <TableCell className="text-slate-300">{apartment.owner_phone || "-"}</TableCell>
                              <TableCell>{getStatusBadge(apartment.status)}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleEdit(apartment)}
                                    className="gap-1 bg-slate-700 text-slate-200 border border-slate-600 hover:bg-slate-600 hover:border-slate-500 transition-all shadow-sm"
                                  >
                                    <Edit className="h-3 w-3" />
                                    Sửa
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleDelete(apartment)}
                                    className="gap-1 bg-red-600/90 text-white border border-red-500 hover:bg-red-600 hover:border-red-500 transition-all shadow-sm"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Xóa
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700">
                          <div className="text-sm font-medium text-slate-300">
                            Trang {currentPage} / {totalPages}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const prevPage = currentPage - 1;
                                if (prevPage >= 1) {
                                  setCurrentPage(prevPage);
                                }
                              }}
                              disabled={currentPage === 1}
                              className="bg-slate-700 text-slate-200 hover:bg-slate-600 border-slate-600 disabled:opacity-50"
                            >
                              Trước
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const nextPage = currentPage + 1;
                                if (nextPage <= totalPages) {
                                  setCurrentPage(nextPage);
                                }
                              }}
                              disabled={currentPage === totalPages}
                              className="bg-slate-700 text-slate-200 hover:bg-slate-600 border-slate-600 disabled:opacity-50"
                            >
                              Sau
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      <ApartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        apartment={selectedApartment}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa căn hộ{" "}
              <strong>{selectedApartment?.apt_id}</strong>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}
