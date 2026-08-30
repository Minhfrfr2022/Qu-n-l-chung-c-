"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react" 
import { ApiCall } from "../../../helper/api";
import { filterType } from "../../../helper/type";

type VehicleType = {
  id: string;
  number: string;
  type: 'car' | 'motorbike' | 'bike';
  color: string;
  owner: string;
  apt_id: string;
};

const vehicleTypeLabels: Record<string, string> = {
  car: "Ô tô",
  motorbike: "Xe máy",
  bike: "Xe đạp",
}

export function SearchTab() {
  const api = new ApiCall();
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    type: "",
    color: "",
    apt_id: "",
    owner: "",
  })
  const [searchResults, setSearchResults] = useState<VehicleType[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [totalResults, setTotalResults] = useState(0);

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
 
  const totalPages = Math.ceil(totalResults / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize

  const fetchResult = async() => {
    let filter: filterType = {};
    if(searchTerm) {
      filter.number = searchTerm;
    }
    if(filters.apt_id) {
      filter.apt_id = filters.apt_id;
    }
    if(filters.color) {
      filter.color = filters.color;
    }
    if(filters.type && filters.type != 'all') {
      filter.type = filters.type;
    }
    if(filters.owner) {
      filter.owner = filters.owner;
    }
    try {
      const results = await api.search_vehicles_with_filter(filter, currentPage, pageSize);
      setSearchResults(results.data);
      setTotalResults(results.total_docs);
      setHasSearched(true);
    }
    catch(error) {
      console.log(error.message);
    }
  }
  
  const handleSearch = async() => {
    await fetchResult();
    setCurrentPage(1);
  }

  const handleReset = () => {
    setSearchTerm("")
    setFilters({
      type: "",
      color: "",
      apt_id: "",
      owner: "",
    })
    setSearchResults([])
    setHasSearched(false)
    setCurrentPage(1) 
  }

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))

  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }
  
  const handlePageClick = (page: number) => {
    setCurrentPage(page)
  }

  useEffect(() => {
    fetchResult();
  },[currentPage, filters, searchTerm]);

  return (
    <div className="space-y-6">

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Tìm kiếm phương tiện</CardTitle>
          <CardDescription className="text-gray-600">
            Nhập biển số xe và sử dụng bộ lọc để tìm kiếm thông tin xe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="number" className="text-gray-700">
              Biển số xe
            </Label>
            <div className="flex gap-2">
              <Input
                id="number"
                placeholder="Nhập biển số xe (VD: 29A-12345)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="typeFilter" className="text-gray-700">
                Loại xe
              </Label>
          
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger id="typeFilter" className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="car">Ô tô</SelectItem>
                  <SelectItem value="motorbike">Xe máy</SelectItem>
                  <SelectItem value="bike">Xe đạp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorFilter" className="text-gray-700">
                Màu sắc
              </Label>
        
              <Input
                id="colorFilter"
                placeholder="Màu sắc"
                value={filters.color}
                onChange={(e) => setFilters({ ...filters, color: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apt_idFilter" className="text-gray-700">
                Căn hộ
              </Label>
         
              <Input
                id="apt_idFilter"
                placeholder="VD: A-101"
                value={filters.apt_id}
                onChange={(e) => setFilters({ ...filters, apt_id: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerFilter" className="text-gray-700">
                Chủ sở hữu
              </Label>
             
              <Input
                id="ownerFilter"
                placeholder="Tên chủ xe"
                value={filters.owner}
                onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4" />
              Tìm kiếm
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2 border-gray-300 hover:bg-gray-100 bg-transparent"
            >
              <X className="h-4 w-4" />
              Xóa bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

   
      {hasSearched && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Kết quả tìm kiếm</CardTitle>
            <CardDescription className="text-gray-600">Tìm thấy {totalResults} phương tiện</CardDescription>
          </CardHeader>
          <CardContent>
            {searchResults.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 hover:bg-gray-50">
                    <TableHead className="text-gray-600">Biển số xe</TableHead>
                    <TableHead className="text-gray-600">Loại xe</TableHead>
                    <TableHead className="text-gray-600">Màu sắc</TableHead>
                    <TableHead className="text-gray-600">Chủ sở hữu</TableHead>
                    <TableHead className="text-gray-600">Căn hộ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Render kết quả đã được phân trang (currentPagedResults) */}
                  {searchResults.map((vehicle) => ( 
                    <TableRow key={vehicle.number} className="border-gray-200 hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">{vehicle.number}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-gray-300 text-gray-700">
                          {vehicleTypeLabels[vehicle.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700">{vehicle.color}</TableCell>
                      <TableCell className="text-gray-700">{vehicle.owner}</TableCell>
                      <TableCell className="text-gray-700">{vehicle.apt_id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-gray-600">Không tìm thấy phương tiện nào phù hợp</div>
            )}
            
          
            {totalResults > pageSize && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Trang {currentPage} / {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Sau
              </Button>
            </div>
          </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}