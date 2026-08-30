// Mock database for maintenance requests
let maintenanceRequests = [
  {
    id: "M001",
    apartment: "A101",
    resident: "Nguyễn Văn A",
    phone: "0912345678",
    issue: "Vòi nước bồn tắm bị rò rỉ",
    status: "in-progress",
    priority: "high",
    date: "2025-12-19",
    assignedTo: "Thợ Minh",
    cost: 250000,
    notes: "Thay van"
  },
  {
    id: "M002",
    apartment: "B205",
    resident: "Trần Thị B",
    phone: "0987654321",
    issue: "Đèn phòng khách không sáng",
    status: "pending",
    priority: "medium",
    date: "2025-12-20",
    notes: "Cần kiểm tra dây điện"
  },
  {
    id: "M003",
    apartment: "C302",
    resident: "Lê Văn C",
    phone: "0901234567",
    issue: "Cửa sổ không đóng được",
    status: "completed",
    priority: "low",
    date: "2025-12-18",
    assignedTo: "Thợ Nam",
    cost: 150000,
    notes: "Đã sửa khóa cửa"
  }
];

module.exports = maintenanceRequests;
