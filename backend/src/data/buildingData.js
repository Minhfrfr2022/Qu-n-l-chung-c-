// Mock database for building info
const buildingInfo = {
  name: "Chung cư BlueMoon",
  address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
  yearBuilt: 2015,
  totalFloors: 25,
  totalApartments: 248,
  manager: "Nguyễn Văn Duy",
  managerPhone: "0212.123.456",
  managerEmail: "manager@bluemoon.vn",
  securityPhone: "0909.999.999",
  frontDeskPhone: "0212.123.455"
};

const regulations = [
  {
    id: "R001",
    title: "Giờ im lặng",
    description: "Từ 22:00 đến 06:00 hôm sau. Không được phát tiếng ồn lớn hoặc tổ chức tiệc tùng trong thời gian này.",
    icon: "🌙"
  },
  {
    id: "R002",
    title: "Vệ sinh chung",
    description: "Cư dân phải giữ sạch sẽ các khu vực chung như hành lang, thang máy, sân vận động.",
    icon: "🧹"
  },
  {
    id: "R003",
    title: "Xe cấm",
    description: "Không được phép đậu xe máy trong tòa nhà. Xe máy phải được đậu tại khu vực quy định.",
    icon: "🚫"
  },
  {
    id: "R004",
    title: "Thú cưng",
    description: "Thú cưng phải được đăng ký. Chủ thú cưng chịu trách nhiệm vệ sinh và kiểm soát thú cưng.",
    icon: "🐕"
  },
  {
    id: "R005",
    title: "Sửa chữa căn hộ",
    description: "Khi cần sửa chữa, phải thông báo trước 24 giờ và không được sửa trong thời gian im lặng.",
    icon: "🔨"
  },
  {
    id: "R006",
    title: "Tiền quản lý",
    description: "Phải thanh toán tiền quản lý trước ngày 5 hàng tháng. Nộp tại quầy tiếp tân hoặc chuyển khoản.",
    icon: "💳"
  }
];

module.exports = { buildingInfo, regulations };
