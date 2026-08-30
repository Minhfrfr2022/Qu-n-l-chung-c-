"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import BackButton from "@/components/BackButton";
import Header from "@/components/Header";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Users,
  Layers,
  Shield,
  Phone,
  Mail,
  Edit2,
  Dumbbell,
  Waves,
  Trophy,
  Sparkles,
  Zap,
  Coffee,
  ShoppingBag,
  Smile,
  TreePine
} from "lucide-react";

interface BuildingInfo {
  name: string;
  address: string;
  yearBuilt: number;
  totalFloors: number;
  totalApartments: number;
  manager: string;
  managerPhone: string;
  managerEmail: string;
  securityPhone: string;
  frontDeskPhone: string;
}

interface Regulation {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export default function BuildingInfoPage() {
  const [buildingInfo] = useState<BuildingInfo>({
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
  });

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(buildingInfo);

  const [regulations] = useState<Regulation[]>([
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
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-72">
        <Header />
        
        {/* Content */}
        <div className="p-6">
          {/* Back Button */}
          <div className="mb-6">
            <BackButton />
          </div>
          
          {/* Header */}
          <div className="bg-white shadow-lg rounded-lg">
            <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Thông tin Chung cư</h1>
                <p className="text-gray-600 mt-1">Quản lý thông tin và quy định chung cư</p>
              </div>
              <button
                onClick={() => setEditMode(!editMode)}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-6 rounded-lg transition flex items-center gap-2"
              >
                <Edit2 className="w-5 h-5" /> Chỉnh sửa
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Thông tin chung cư */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Thông tin Chung cư</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-cyan-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin cơ bản</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Tên chung cư:</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                    />
                  ) : (
                    <p className="text-gray-800 font-semibold">{buildingInfo.name}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-600">Địa chỉ:</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editData.address}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                    />
                  ) : (
                    <p className="text-gray-800 font-semibold">{buildingInfo.address}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-600">Năm xây dựng:</label>
                  <p className="text-gray-800 font-semibold">{buildingInfo.yearBuilt}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tổng số tầng:</span>
                  <span className="text-2xl font-bold text-gray-800">{buildingInfo.totalFloors}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tổng số căn hộ:</span>
                  <span className="text-2xl font-bold text-gray-800">{buildingInfo.totalApartments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Năm xây dựng:</span>
                  <span className="font-semibold text-gray-800">{buildingInfo.yearBuilt}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin liên hệ */}
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-600" /> Thông tin liên hệ & Hỗ trợ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600">Quản lý chung cư:</label>
                {editMode ? (
                  <>
                    <input
                      type="text"
                      placeholder="Tên"
                      value={editData.manager}
                      onChange={(e) => setEditData({ ...editData, manager: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-2"
                    />
                    <input
                      type="tel"
                      placeholder="Số điện thoại"
                      value={editData.managerPhone}
                      onChange={(e) => setEditData({ ...editData, managerPhone: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-800">{buildingInfo.manager}</p>
                    <p className="text-gray-600">📞 {buildingInfo.managerPhone}</p>
                  </>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">Email quản lý:</label>
                <p className="font-semibold text-gray-800">📧 {buildingInfo.managerEmail}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Số điện thoại khác:</label>
                <p className="font-semibold text-gray-800">
                  🚨 Bảo vệ: {buildingInfo.securityPhone}
                </p>
                <p className="text-gray-600 text-sm">
                  📞 Tiếp tân: {buildingInfo.frontDeskPhone}
                </p>
              </div>
            </div>
          </div>

          {editMode && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditMode(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded transition"
              >
                Lưu thay đổi
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded transition"
              >
                Hủy
              </button>
            </div>
          )}
        </div>

        {/* Quy định chung cư */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" /> Quy định Nội quy Chung cư
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {regulations.map((reg) => (
              <div key={reg.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{reg.icon}</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{reg.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{reg.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tiện ích Chung cư */}
        <div className="bg-white rounded-lg shadow-md p-8 mt-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-green-600" /> Tiện ích Chung
          </h2>

          <p className="text-gray-700 mb-8">Khám phá hệ sinh thái tiện ích đầy đủ của BlueMoon phục vụ mọi nhu cầu sống của cư dân:</p>

          {/* Detailed facility list: icon left, description right */}
          <div className="space-y-4">
            {[
              {
                id: 'f1',
                icon: <Dumbbell className="w-12 h-12 text-orange-600" />,
                title: 'Phòng tập Gym chuyên nghiệp',
                text: 'Phòng tập Gym hiện đại với diện tích 2000m² được trang bị đầy đủ các máy tập huyền thoại và hiện đại nhất từ các hãng nổi tiếng thế giới. Khu vực được chia thành vùng tập lực, cardio, yoga và boxing để phục vụ mọi nhu cầu tập luyện. Đội ngũ huấn luyện viên chứng chỉ quốc tế sẵn sàng hỗ trợ lập kế hoạch tập luyện cá nhân và nhóm.'
              },
              {
                id: 'f2',
                icon: <Waves className="w-12 h-12 text-blue-600" />,
                title: 'Hồ bơi Olympic & khu thư giãn',
                text: 'Hồ bơi Olympic chuẩn thi đấu kích thước 50x25 mét với 8 làn bơi lôi chuẩn thi đấu quốc tế, được kiểm soát nhiệt độ 28-30°C quanh năm. Khu bar ven hồ phục vụ đồ uống mát lạnh, khu ghế nằm toàn mặt trời với tấm che nắng cao cấp. Phòng xông hơi, bồn tắm nước nóng lạnh riêng biệt dành cho thư giãn sau tập luyện.'
              },
              {
                id: 'f3',
                icon: <Trophy className="w-12 h-12 text-yellow-600" />,
                title: 'Sân thể thao đa năng',
                text: 'Khu sân thể thao diện tích lớn bao gồm 2 sân bóng rổ tiêu chuẩn, 4 sân tennis và 6 sân pickleball được chiếu sáng LED hiện đại. Các sân được bảo trì chuyên nghiệp với mặt sân chuẩn quốc tế, phòng chuẩn bị, ghế xem đấu đầy đủ. Cộng đồng cư dân tổ chức các giải đấu thể thao mỗi tháng với các phần thưởng hấp dẫn.'
              },
              {
                id: 'f4',
                icon: <Smile className="w-12 h-12 text-pink-600" />,
                title: 'Khu vui chơi trẻ em an toàn',
                text: 'Khu vui chơi rộng 1500m² được thiết kế an toàn cho trẻ em từ 2-12 tuổi với bề mặt đệm an toàn, được sertifikat quốc tế. Bao gồm cầu trượt, xích đu, tường leo, bể bóng và nhiều trò chơi vận động sáng tạo kích thích phát triển nhận thức. Nhân viên giám sát chuyên nghiệp trực 24/7 đảm bảo an toàn cho các bé.'
              },
              {
                id: 'f5',
                icon: <Sparkles className="w-12 h-12 text-purple-600" />,
                title: 'Wellness Center & Quán cà phê',
                text: 'Wellness Center 1000m² cung cấp các dịch vụ spa, massage thư giãn, bể nước nóng lạnh chuyên trị bệnh, xông hơi khô và ướt, phòng yoga cao cấp. Các liệu pháp được thực hiện bởi chuyên gia wellness quốc tế với các sản phẩm thiên nhiên cao cấp. Quán cà phê ẩm thực kế bên phục vụ các đồ uống và mon ăn nhẹ chất lượng cao.'
              },
              {
                id: 'f6',
                icon: <ShoppingBag className="w-12 h-12 text-green-600" />,
                title: 'Cửa hàng tiện lợi 24/7',
                text: 'Cửa hàng tiện lợi mở cửa 24/7 cung cấp đầy đủ nhu yếu phẩm sinh hoạt, thực phẩm tươi sống, đồ uống và các sản phẩm chăm sóc cá nhân. Hệ thống dịch vụ giao hàng nhanh 30 phút và thanh toán linh hoạt qua ví điện tử. Khu bán vé máy bay, nạp tiền điện thoại, cửa hàng cắt tóc, bưu điểm gửi hàng đều có sẵn trong tòa nhà.'
              }
            ].map((item) => (
              <div key={item.id} className="flex items-start gap-4 bg-slate-50 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex-shrink-0 bg-white rounded-lg p-3">
                  {item.icon}
                </div>
                <div className="flex-grow">
                  <h4 className="text-lg font-semibold text-gray-800">{item.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
      </div>
    </div>
  );
}
