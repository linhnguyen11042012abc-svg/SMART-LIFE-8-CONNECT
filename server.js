import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public"), { etag: true, maxAge: "1h" }));

function createOfflineAnswer(rawQuestion) {
  const question = String(rawQuestion || "").trim();
  const q = question.toLocaleLowerCase("vi-VN");
  if (!question) return "Bạn hãy nhập câu hỏi để mình hỗ trợ nhé.";
  if (/^(chào|hello|hi|xin chào|alo)\b/.test(q)) {
    return "Xin chào! Mình là SMART AI. Mình có thể hỗ trợ bạn lập kế hoạch học tập, giải thích kiến thức phổ thông, tổ chức công việc gia đình và gợi ý hoạt động cộng đồng. Bạn muốn bắt đầu với nội dung nào?";
  }
  if (/kế hoạch|thời khóa biểu|ôn tập|lịch học/.test(q)) {
    return "Mình gợi ý bạn lập kế hoạch theo 4 bước:\n\n1. Xác định mục tiêu cụ thể cần hoàn thành.\n2. Chia nội dung thành các nhiệm vụ nhỏ, mỗi phiên 25–30 phút.\n3. Xen kẽ 5 phút nghỉ sau mỗi phiên và ưu tiên môn khó khi còn tỉnh táo.\n4. Cuối ngày đánh dấu việc đã xong, ghi lại phần chưa hiểu để hỏi thầy cô.\n\nBạn có thể cho mình biết lớp học, môn học và thời hạn để lập lịch sát hơn.";
  }
  if (/quang hợp|cây xanh|diệp lục/.test(q)) {
    return "Quang hợp là quá trình cây xanh sử dụng năng lượng ánh sáng (nhờ chất diệp lục) để tạo chất hữu cơ từ nước và khí carbon dioxide, đồng thời giải phóng oxygen.\n\nCó thể nhớ ngắn gọn: ánh sáng + nước + CO₂ → chất hữu cơ + O₂. Đây là cách diễn đạt khái quát; phương trình và điều kiện cụ thể cần đối chiếu sách giáo khoa.";
  }
  if (/toán|phương trình|hình học|đại số/.test(q)) {
    return "Mình có thể hướng dẫn từng bước. Bạn hãy gửi đầy đủ đề bài (kèm hình vẽ nếu có), cho biết lớp/mức học và phần bạn đang vướng. Mình sẽ trình bày cách làm, giải thích lý do từng bước và kiểm tra kết quả.";
  }
  if (/tiết kiệm điện|tiết kiệm nước|điện nước|hóa đơn/.test(q)) {
    return "Một số cách tiết kiệm trong gia đình:\n\n• Tắt đèn, quạt và thiết bị khi không sử dụng.\n• Ưu tiên thiết bị có nhãn năng lượng phù hợp.\n• Kiểm tra rò rỉ vòi nước và sửa sớm.\n• Ghi chỉ số điện, nước định kỳ để so sánh mức dùng.\n• Đặt mục tiêu giảm từng bước thay vì thay đổi quá đột ngột.\n\nBạn có thể nhập số liệu hằng tháng vào mục Trợ lý gia đình để theo dõi.";
  }
  if (/môi trường|sống xanh|rác thải|trồng cây/.test(q)) {
    return "Bạn có thể bắt đầu bằng những việc nhỏ, dễ duy trì:\n\n1. Phân loại rác tại nguồn và hạn chế đồ nhựa dùng một lần.\n2. Mang bình nước, túi sử dụng nhiều lần.\n3. Tiết kiệm điện, nước ở nhà và trường học.\n4. Trồng, chăm sóc cây xanh.\n5. Rủ bạn bè cùng thực hiện và ghi nhận kết quả mỗi tuần.";
  }
  if (/tóm tắt|rút gọn|nội dung sau/.test(q)) {
    return "Bạn hãy dán đoạn văn bản cần tóm tắt ngay sau yêu cầu. Mình sẽ giúp bạn rút ra chủ đề, các ý chính và kết luận. Lưu ý: SMART AI hiện hoạt động ngoại tuyến theo bộ quy tắc, nên với văn bản dài hoặc chuyên sâu bạn nên kiểm tra lại bản tóm tắt.";
  }
  if (/gia đình|việc nhà|phân công/.test(q)) {
    return "Để phân công việc nhà công bằng, bạn có thể:\n\n• Liệt kê các việc cần làm và tần suất.\n• Chia theo thời gian, sức khỏe và khả năng của từng thành viên.\n• Ghi rõ người phụ trách và thời hạn.\n• Luân phiên những việc ít được yêu thích.\n• Cùng xem lại lịch mỗi tuần và điều chỉnh khi cần.";
  }
  return "Mình đã nhận được câu hỏi của bạn. Hiện SMART AI 7.0 đang chạy ngoại tuyến bằng bộ quy tắc và nội dung mẫu, chưa kết nối mô hình AI trực tuyến nên chưa thể hiểu và trả lời mọi chủ đề.\n\nĐể mình hỗ trợ chính xác hơn, bạn hãy nói rõ mục tiêu, lớp học/lĩnh vực liên quan và gửi nội dung hoặc đề bài cụ thể. Với thông tin quan trọng, hãy kiểm tra lại từ nguồn đáng tin cậy.";
}

app.get("/api/status", (_req, res) => {
  res.json({ ok: true, aiConfigured: false, mode: "offline-rules", version: "7.0.1", message: "SMART AI đang chạy ngoại tuyến bằng bộ quy tắc." });
});

app.post("/api/ai", (req, res) => {
  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  if (!question) return res.status(400).json({ error: "Vui lòng nhập câu hỏi." });
  if (question.length > 2500) return res.status(413).json({ error: "Câu hỏi quá dài. Vui lòng giới hạn 2.500 ký tự." });
  return res.json({ answer: createOfflineAnswer(question), mode: "offline-rules" });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SMART LIFE INFINITE ADVENTURE 7.0.1 dang chay tai http://localhost:${PORT}`);
});
