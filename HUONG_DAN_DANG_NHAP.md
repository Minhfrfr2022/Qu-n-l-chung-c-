# HƯỚNG DẪN ĐĂNG NHẬP VÀ VỊ TRÍ LẤY THÔNG TIN TÀI KHOẢN

Tài liệu này hướng dẫn cách lấy và quản lý thông tin đăng nhập cho 2 nhóm đối tượng: **Ban Quản trị (Admin)** và **Cư dân (User)** trong hệ thống Quản lý Chung cư BlueMoon.

---

## 1. Tài khoản Quản trị viên (Admin / Manager)

### 📍 Vị trí lấy thông tin tài khoản Admin:
* **File chứa cấu hình khởi tạo Admin:** 
  `backend/tests/createAdmin.js`
* **Cơ sở dữ liệu quản lý quyền:** 
  Bảng `profiles` trên Supabase (các tài khoản có cột `role = 'admin'` hoặc `role = 'manager'`).

### 🔑 Cách khởi tạo hoặc lấy thông tin tài khoản Admin:
1. Mở file `backend/tests/createAdmin.js` để xem thông tin tài khoản Admin mặc định được thiết lập trong mã nguồn:
2. Để tự động tạo hoặc đồng bộ lại tài khoản Admin này vào cơ sở dữ liệu Supabase, mở Terminal và chạy:
   ```powershell
   cd backend
   node tests/createAdmin.js
   ```

---

## 2. Tài khoản Cư dân (User / Resident)

### 📍 Vị trí lấy thông tin tài khoản Cư dân:
* **Cơ sở dữ liệu quản lý người dùng:** 
  Bảng `profiles` và bảng `auth.users` trên **Supabase Dashboard** (các tài khoản có cột `role = 'user'`).
* **Bảng liên kết căn hộ:** 
  Bảng `apartments` (cột `owner_id`) và bảng `residents` để xem thông tin cư dân và số phòng tương ứng.

### 🔑 Cách tạo và đăng nhập tài khoản Cư dân:
1. **Cách 1: Đăng ký trực tiếp trên giao diện Web**
   - Truy cập trang Đăng nhập (`/login`) $\rightarrow$ Chọn **"Đăng ký tài khoản mới"**.
   - Điền Email, Mật khẩu, Họ tên và Mã căn hộ (VD: `A101`, `B202`...).
   - Sau khi đăng ký thành công, tài khoản sẽ tự động được cấp quyền `role = 'user'`.
2. **Cách 2: Tra cứu danh sách tài khoản đã có sẵn**
   - Đăng nhập tài khoản Admin $\rightarrow$ Truy cập mục **"Quản lý Người dùng" (`/admin/users`)** để xem danh sách toàn bộ Email cư dân trong hệ thống.
   - Hoặc tra cứu trực tiếp tại bảng `profiles` trên giao diện quản trị Supabase.

---

## 3. Tổng kết đường dẫn file liên quan

| Loại tài khoản | File chứa thông tin / Script tạo | Vị trí lưu trữ trong Database |
| :--- | :--- | :--- |
| **Admin** | `backend/tests/createAdmin.js` | Bảng `profiles` (`role = 'admin'`) |
| **User (Cư dân)** | Đăng ký tại `/login` hoặc xem tại `/admin/users` | Bảng `profiles` (`role = 'user'`) |
| **Biến môi trường Auth** | `backend/.env.local` & `frontend/.env.local` | Khóa API `SUPABASE_URL` & `SUPABASE_KEY` |
