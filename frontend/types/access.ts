export interface Visitor {
  id: string;
  resident_id: string;
  visitor_name: string;
  visitor_phone?: string;
  visitor_email?: string;
  purpose: string;
  expected_arrival: string;
  expected_departure?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  resident?: {
    id: string;
    username: string;
    full_name: string;
    apartment_number?: string;
    email: string;
    yearOfBirth?: number;
    hometown?: string;
    gender?: 'male' | 'female' | 'other' | string;
  };
  approver?: {
    id: string;
    username: string;
    full_name: string;
  };
}

// Thẻ cư dân
export interface AccessCard {
  id: string;
  resident_id: string;
  card_number: string; // Số thẻ
  card_type: 'resident' | 'guest' | 'staff'; // Loại thẻ: Cư dân, Khách, Nhân viên
  status: 'active' | 'inactive' | 'lost' | 'blocked'; // Trạng thái: Hoạt động, Không hoạt động, Mất, Bị khóa
  issued_date: string; // Ngày cấp
  issued_by?: string; // Người cấp
  expiry_date?: string; // Ngày hết hạn
  reason_for_status?: string; // Lý do trạng thái
  notes?: string; // Ghi chú
  created_at: string;
  updated_at: string;
  resident?: {
    id: string;
    username: string;
    full_name: string;
    apartment_number?: string;
    email: string;
    phone_number?: string;
    yearOfBirth?: number;
    hometown?: string;
    gender?: 'male' | 'female' | 'other' | string;
  };
  issuer?: {
    id: string;
    username: string;
    full_name: string;
  };
}

// Lịch sử quét thẻ
export interface CardAccessLog {
  id: string;
  card_id: string;
  resident_id: string;
  access_point: string; // Vị trí: Cổng chính, Thang máy, Bãi xe, v.v.
  access_type: 'entry' | 'exit'; // Loại: Vào/Ra
  access_status: 'success' | 'denied' | 'expired' | 'blocked'; // Trạng thái quét
  access_time: string; // Thời gian quét
  device_id?: string; // Mã thiết bị
  notes?: string; // Ghi chú
  created_at: string;
}

// Lịch sử thay đổi thẻ
export interface CardHistory {
  id: string;
  card_id: string;
  resident_id: string;
  action_type: 'created' | 'activated' | 'deactivated' | 'lost_reported' | 'blocked' | 'renewed' | 'expired' | 'damaged_reported' | 'replaced';
  action_by?: string;
  old_status?: string;
  new_status?: string;
  old_expiry_date?: string;
  new_expiry_date?: string;
  reason?: string;
  notes?: string;
  created_at: string;
  action_user?: {
    id: string;
    username: string;
    full_name: string;
  };
}

// Phí phạt thẻ
export interface CardFee {
  id: string;
  card_id: string;
  resident_id: string;
  fee_type: 'lost' | 'damaged' | 'late_return' | 'replacement' | 'other';
  amount: number; // Số tiền phí
  description?: string; // Mô tả
  status: 'pending' | 'paid' | 'waived'; // Trạng thái: Chờ thanh toán, Đã thanh toán, Miễn giảm
  issued_by?: string; // Người tạo phí
  paid_at?: string; // Ngày thanh toán
  created_at: string;
  updated_at: string;
  issuer?: {
    id: string;
    username: string;
    full_name: string;
  };
}

// Thống kê thẻ
export interface CardStatistics {
  total: number; // Tổng số thẻ
  active: number; // Số thẻ đang hoạt động
  inactive: number; // Số thẻ không hoạt động
  lost: number; // Số thẻ bị mất
  blocked: number; // Số thẻ bị khóa
  by_type: {
    resident: number; // Số thẻ cư dân
    guest: number; // Số thẻ khách
    staff: number; // Số thẻ nhân viên
  };
  fees: {
    total_pending: number; // Tổng phí chờ thanh toán
    total_paid: number; // Tổng phí đã thanh toán
    count_pending: number; // Số lượng phí chờ
    count_paid: number; // Số lượng phí đã thanh toán
  };
}
