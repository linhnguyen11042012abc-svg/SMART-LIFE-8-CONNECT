# SMART LIFE 7.0.1 – INFINITE ADVENTURE

Bản tinh chỉnh giao diện và hoàn thiện tương tác dựa trên SMART LIFE 7.0. Giữ bốn khu vực chính: Góc học tập, Trợ lý gia đình, Kết nối cộng đồng và SMART AI.

## Thay đổi 7.0.1
- Gom các chức năng học tập thành nhóm nhỏ bên trong Góc học tập; bản đồ, Boss, nhân vật và cửa hàng nằm trong cùng cửa sổ Thế giới phiêu lưu.
- Thu gọn thẻ, khoảng cách, tiêu đề và các bảng ở bốn khu vực.
- Bổ sung nhạc nền tổng hợp ngoại tuyến có nút bật/tắt trên thanh trên cùng; hiệu ứng âm thanh đúng/sai trong luyện tập, Skill Tree và màn chơi. Âm thanh chỉ bắt đầu sau thao tác bật của người dùng.
- Hoàn thiện màn ghép đôi bằng cách chọn thẻ câu hỏi và thẻ đáp án theo cặp.
- SMART AI hỗ trợ gửi bằng nút hoặc phím Enter, có thời hạn chờ 8 giây và câu trả lời dự phòng ngoại tuyến nếu API chưa phản hồi.
- Thẻ lật có nút tự đánh giá “Mình đã nhớ” hoặc “Cần ôn lại”.
- English Skill Tree giữ bốn nhánh Nghe, Đọc, Viết, Nói với bài tập riêng; cần đạt ít nhất 2/3 câu đúng để tăng điểm kỹ năng.
- Giữ khóa dữ liệu cũ; tiến độ bản đồ dùng khóa `smartLife_infiniteWorld_v7`.

## Chạy trên Termux
```bash
cd ~/smart-life
npm install
npm start
```
Mở `http://localhost:3000`.

## Cập nhật an toàn
Sao lưu thư mục `~/smart-life` trước khi chép đè. Không xóa dữ liệu trang web/localStorage nếu muốn giữ XP, xu, thành tích và tiến độ.

SMART AI là mô phỏng ngoại tuyến theo bộ quy tắc và nội dung mẫu, không cần API key.
