"use client";

import { useState, useEffect } from "react";
import { type Apartment, ApartmentStatus } from "@/lib/apartmentApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";

interface ApartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartment?: Apartment | null;
  onSubmit: (data: Apartment) => Promise<void>;
}

export function ApartmentDialog({
  open,
  onOpenChange,
  apartment,
  onSubmit,
}: ApartmentDialogProps) {
  const [formData, setFormData] = useState<Partial<Apartment>>({
    apt_id: "",
    floor: undefined,
    area: undefined,
    owner_name: "",
    owner_phone: "",
    owner_email: "",
    status: "vacant",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (apartment) {
      setFormData({
        apt_id: apartment.apt_id || "",
        floor: apartment.floor,
        area: apartment.area,
        owner_name: apartment.owner_name || "",
        owner_phone: apartment.owner_phone || "",
        owner_email: apartment.owner_email || "",
        status: apartment.status || "vacant",
      });
    } else {
      setFormData({
        apt_id: "",
        floor: undefined,
        area: undefined,
        owner_name: "",
        owner_phone: "",
        owner_email: "",
        status: "vacant",
      });
    }
  }, [apartment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData as Apartment);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {apartment ? "Chỉnh sửa căn hộ" : "Thêm căn hộ mới"}
          </DialogTitle>
          <DialogDescription>
            {apartment
              ? "Cập nhật thông tin căn hộ"
              : "Điền thông tin để thêm căn hộ mới"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="apt_id">Mã căn hộ *</Label>
              <Input
                id="apt_id"
                value={formData.apt_id}
                onChange={(e) =>
                  setFormData({ ...formData, apt_id: e.target.value })
                }
                placeholder="VD: A101"
                required
                disabled={!!apartment}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="floor">Tầng</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      floor: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="VD: 1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="area">Diện tích (m²)</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.01"
                  value={formData.area || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      area: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="VD: 50.5"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner_name">Tên chủ hộ *</Label>
              <Input
                id="owner_name"
                value={formData.owner_name}
                onChange={(e) =>
                  setFormData({ ...formData, owner_name: e.target.value })
                }
                placeholder="VD: Nguyễn Văn A"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner_phone">Số điện thoại</Label>
              <Input
                id="owner_phone"
                value={formData.owner_phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, owner_phone: e.target.value })
                }
                placeholder="VD: 0901234567"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner_email">Email</Label>
              <Input
                id="owner_email"
                type="email"
                value={formData.owner_email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, owner_email: e.target.value })
                }
                placeholder="VD: example@email.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as ApartmentStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacant">Trống</SelectItem>
                  <SelectItem value="occupied">Đã có người ở</SelectItem>
                  <SelectItem value="rented">Cho thuê</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : apartment ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

