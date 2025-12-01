# Ứng dụng Di động AirsKy Airlines

![AirsKy](https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/og.jpg)

Chào mừng bạn đến với dự án ứng dụng di động của AirsKy Airlines! Đây là một ứng dụng đặt vé máy bay toàn diện được xây dựng bằng React Native và Expo, cung cấp cho người dùng trải nghiệm liền mạch từ tìm kiếm chuyến bay, đặt vé, quản lý chuyến đi cho đến làm thủ tục trực tuyến (check-in).

## ✨ Tính năng nổi bật

Ứng dụng bao gồm đầy đủ các chức năng cần thiết cho một hãng hàng không hiện đại:

-   **Xác thực người dùng**:
    -   Đăng nhập, đăng ký tài khoản truyền thống (email/mật khẩu).
    -   Đăng nhập nhanh chóng và an toàn qua Google.
    -   Quy trình quên mật khẩu và đặt lại mật khẩu.
    -   Xác thực tài khoản qua mã OTP.

-   **Trang chủ (Dashboard)**:
    -   Giao diện hiện đại với header động.
    -   Các lối tắt nhanh đến các chức năng quan trọng.
    -   Hiển thị các bài viết, tin tức và khuyến mãi mới nhất.
    -   Hệ thống thông báo trong ứng dụng.

-   **Đặt vé máy bay**:
    -   Tìm kiếm chuyến bay một chiều và khứ hồi.
    -   Lựa chọn điểm đi, điểm đến, ngày và số lượng hành khách.

-   **Quản lý chuyến đi của tôi**:
    -   Giao diện theo thẻ (tab) để dễ dàng lọc các chuyến đi: *Chờ thanh toán*, *Sắp tới*, *Đã hoàn thành*, và *Đã hủy*.
    -   Xem chi tiết lịch sử đặt vé.
    -   Tìm kiếm và truy xuất thông tin đặt vé khi chưa đăng nhập.

-   **Check-in trực tuyến**:
    -   Tìm kiếm đặt vé bằng Mã đặt chỗ (PNR) và Họ tên.
    -   Lựa chọn chuyến bay và hành khách để làm thủ tục.
    -   Sơ đồ ghế ngồi trực quan, cho phép chọn hoặc thay đổi ghế.
    -   Xử lý thanh toán cho các dịch vụ phát sinh (ví dụ: chọn ghế có phí).
    -   Tạo và hiển thị Boarding Pass điện tử.
    -   Lưu Boarding Pass về thư viện ảnh của thiết bị.

-   **Kết quả đặt vé**:
    -   Hiển thị chi tiết trạng thái đặt vé (Thành công, Thất bại, Chờ thanh toán, Đã hủy).
    -   Hiển thị mã QR và bộ đếm thời gian cho các thanh toán đang chờ.
    -   Chia sẻ thông tin chuyến bay qua các ứng dụng khác.

-   **Hồ sơ người dùng**:
    -   Xem và chỉnh sửa thông tin cá nhân (tên, ngày sinh, ảnh đại diện).
    -   Thay đổi mật khẩu.
    -   Xem thông tin chương trình khách hàng thân thiết (hạng thành viên, điểm tích lũy).

## 🚀 Công nghệ sử dụng

Dự án được xây dựng trên một nền tảng công nghệ hiện đại và mạnh mẽ:

-   **Framework**: React Native & Expo
-   **Ngôn ngữ**: TypeScript
-   **Styling**: Tailwind CSS (thông qua `nativewind`)
-   **Routing**: Expo Router (hệ thống routing dựa trên file)
-   **Quản lý trạng thái & Cache**: React Query (`@tanstack/react-query`)
-   **UI Components**: React Native Paper
-   **Xác thực**: Expo Auth Session (cho Google Login), JWT
-   **Thư viện khác**: `date-fns`, `expo-image-picker`, `expo-media-library`

## 📂 Cấu trúc thư mục

Cấu trúc dự án được tổ chức một cách khoa học, tận dụng tối đa sức mạnh của Expo Router.


## 🛠️ Cài đặt và Chạy dự án

Làm theo các bước sau để chạy dự án trên máy của bạn.

### Yêu cầu

-   Node.js (phiên bản LTS)
-   Yarn hoặc npm
-   Expo Go trên thiết bị di động (iOS hoặc Android)
-   Expo CLI:
    ```bash
    npm install -g expo-cli
    ```

### Các bước cài đặt

1.  **Clone repository:**
    ```bash
    git clone <URL_CUA_REPOSITORY>
    cd <TEN_THU_MUC_DU_AN>
    ```

2.  **Cài đặt các dependencies:**
    ```bash
    npm install
    # hoặc
    yarn install
    ```

3.  **Thiết lập biến môi trường:**

    Tạo một tệp `.env` ở thư mục gốc và định nghĩa các biến cần thiết, ví dụ như URL của API backend.
    ```env
    EXPO_PUBLIC_API_URL=http://your-backend-api-url.com/api
    ```

4.  **Chạy ứng dụng:**
    ```bash
    npx expo start
    ```

5.  **Mở ứng dụng trên thiết bị:**

    -   Quét mã QR hiển thị trên terminal bằng ứng dụng Camera (iOS) hoặc trong ứng dụng Expo Go (Android).
    -   Hoặc chạy trên máy ảo bằng cách nhấn `a` (Android) hoặc `i` (iOS Simulator).

## 🤝 Đóng góp

Chúng tôi luôn chào đón các đóng góp để cải thiện dự án. Vui lòng tạo một `Pull Request` hoặc `Issue` nếu bạn có bất kỳ ý tưởng hoặc sửa lỗi nào.

---

Cảm ơn bạn đã quan tâm đến dự án AirsKy! Chúc bạn có những trải nghiệm bay tuyệt vời. ✈️
