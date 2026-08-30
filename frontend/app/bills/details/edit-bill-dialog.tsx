"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Zap, Droplet, Wrench, Car, AlertCircle } from "lucide-react"
import type { Bill } from "../types"

interface EditBillDialogProps {
  bill: Bill | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSave: (bill: Bill) => void
}

export function EditBillDialog({ bill, isOpen, onOpenChange, onSave }: EditBillDialogProps) {
  const [editData, setEditData] = useState<Bill | null>(null)

  useEffect(() => {
    if (bill) {
      setEditData({ ...bill })
    }
  }, [bill])

  if (!editData) return null

  const handleSave = () => {
    const updatedBill: Bill = {
      ...editData,
      
    }
    onSave(updatedBill)
    alert("Lưu thay đổi thành công!")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Sửa hóa đơn - Căn hộ {editData.apt_id}</DialogTitle>
          <DialogDescription className="text-gray-600">Chủ sở hữu: {editData.owner}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="electricity" className="flex items-center gap-2 text-gray-600">
                <Zap className="h-4 w-4 text-yellow-600" />
                Tiền điện
              </Label>
              <Input className="text-gray-600"
                id="electricity"
                type="number"
                value={editData.electric}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    electric: Number.parseInt(e.target.value) ,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="water" className="flex items-center gap-2 text-gray-600">
                <Droplet className="h-4 w-4 text-blue-600" />
                Tiền nước
              </Label>
              <Input className="text-gray-600"
                id="water"
                type="number"
                value={editData.water}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    water: Number.parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service" className="flex items-center gap-2 text-gray-600">
                <Wrench className="h-4 w-4 text-purple-600" />
                Tiền dịch vụ
              </Label>
              <Input className="text-gray-600"
                id="service"
                type="number"
                value={editData.service}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    service: Number.parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parking" className="flex items-center gap-2 text-gray-600">
                <Car className="h-4 w-4 text-green-600" />
                Phí trông xe
              </Label>
              <Input className="text-gray-600"
                id="parking"
                type="number"
                value={editData.vehicles}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    vehicles: Number.parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previousDebt" className="flex items-center gap-2 text-gray-600">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Tổng dư nợ các kỳ trước
              </Label>
              <Input className="text-gray-600"
                id="previousDebt"
                type="number"
                value={editData.pre_debt}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    pre_debt: Number.parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1 bg-transparent text-gray-600 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent text-gray-600 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group" onClick={handleSave}>
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
