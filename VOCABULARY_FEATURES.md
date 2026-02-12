# 📚 Hướng dẫn Tính năng Học Từ Vựng Mới

## 🎯 Tổng Quan

Hệ thống học từ vựng đã được nâng cấp với nhiều tính năng mới giúp bạn học và ôn tập từ vựng hiệu quả hơn:

1. **Flashcard System** - Học từ vựng theo kiểu lật thẻ
2. **Vocabulary Quiz** - Kiểm tra từ vựng với nhiều chế độ
3. **Text Selection & Save** - Lưu từ vựng từ reading passages
4. **Language Toggle** - Chuyển đổi giữa EN/VI khi ôn tập

---

## 🎴 1. Flashcard - Học Từ Vựng Kiểu Lật Thẻ

### Cách sử dụng:

1. Vào tab **📖 Từ vựng**
2. Trong phần **🎯 Chế độ học**, chọn một trong các chế độ Flashcard:
   - **🎴 Flashcard - Tất cả từ**: Ôn tập tất cả từ vựng
   - **✨ Flashcard - Từ mới**: Chỉ ôn các từ chưa từng ôn
   - **💪 Flashcard - Từ yếu**: Tập trung vào từ có độ thành thạo thấp

### Cách hoạt động:

- **Mặt trước**: Hiển thị từ tiếng Anh + phiên âm (nếu có)
- **Mặt sau**: Hiển thị nghĩa tiếng Việt + ví dụ + thông tin
- **Click vào thẻ** hoặc nhấn **Space/Enter** để lật thẻ
- Sau khi lật, đánh giá độ nhớ của bạn:
  - **😓 Khó** (phím 1): Từ khó, chưa nhớ
  - **🤔 Tạm được** (phím 2): Nhớ được phần nào
  - **😄 Dễ** (phím 3): Nhớ rất rõ

### Phím tắt:

- `Space` hoặc `Enter`: Lật thẻ
- `←` (Left Arrow): Thẻ trước
- `→` (Right Arrow): Thẻ sau
- `1`, `2`, `3`: Đánh giá độ thành thạo

### Tính năng:

- ✅ Theo dõi tiến độ học
- ✅ Đếm số từ nhớ tốt / cần ôn lại
- ✅ Tự động cập nhật độ thành thạo (masteryLevel)
- ✅ Hiển thị tóm tắt khi hoàn thành

---

## 📝 2. Vocabulary Quiz - Kiểm Tra Từ Vựng

### Các chế độ Quiz:

1. **📝 Quiz - Trắc nghiệm (10 câu)**:
   - Chọn đáp án đúng từ 4 lựa chọn
   - Phù hợp để kiểm tra nhanh

2. **✍️ Quiz - Tự luận (10 câu)**:
   - Tự nhập nghĩa của từ
   - Rèn luyện khả năng nhớ chủ động

3. **🎲 Quiz - Hỗn hợp (15 câu)**:
   - Kết hợp cả trắc nghiệm và tự luận
   - Kiểm tra toàn diện

### Cách sử dụng:

1. Vào tab **📖 Từ vựng**
2. Chọn một trong các chế độ Quiz
3. Trả lời từng câu hỏi
4. Nhấn **Kiểm tra đáp án** để xem kết quả
5. Nhấn **Câu tiếp theo** để tiếp tục

### Sau khi hoàn thành:

- Xem **kết quả tổng hợp**: Số câu đúng, độ chính xác, thời gian
- **📋 Xem câu sai**: Review lại các từ trả lời sai
- **🔄 Làm lại**: Bắt đầu quiz mới với cùng chế độ

### Tính năng:

- ✅ Tự động sinh câu hỏi từ danh sách từ vựng
- ✅ Câu trả lời sai có gợi ý đáp án đúng
- ✅ Cập nhật độ thành thạo sau mỗi lần làm
- ✅ Lưu kết quả vào lịch sử hoạt động
- ✅ Hỗ trợ Enter để submit (chế độ tự luận)

---

## 💾 3. Text Selection & Save Vocabulary

### Cách sử dụng:

**Khi đọc Reading Passage:**

1. **Bôi đen** (select) từ hoặc cụm từ bạn muốn lưu (1-3 từ)
2. Một **tooltip** sẽ hiện lên với 2 nút:
   - **💾 Lưu vào từ vựng**: Mở form nhập thông tin
   - **🌐 Dịch**: Dịch từ tự động (dùng MyMemory API)

3. **Nếu chọn "Lưu":**
   - Form nhập thông tin sẽ hiện ra
   - Điền nghĩa (bắt buộc), phiên âm và ví dụ (tùy chọn)
   - Nhấn **💾 Lưu** hoặc Enter

4. **Nếu chọn "Dịch":**
   - Hệ thống sẽ tự động dịch từ tiếng Anh sang tiếng Việt
   - Nếu từ đã có trong danh sách, hiển thị ngay
   - Nếu chưa có, dùng API dịch tự động
   - Có nút **💾 Lưu nghĩa này** để lưu nhanh

### Hoạt động ở đâu:

- ✅ **Reading passages** (trong Practice mode)
- ✅ **Flashcard** (cả mặt trước và sau)
- ✅ **Quiz questions** (phần hiển thị từ)

### Tính năng:

- ✅ Auto-detect từ đã có trong vocabulary
- ✅ Dịch tự động qua API miễn phí
- ✅ Tooltip tự động ẩn sau 10 giây
- ✅ Phân loại từ với category: `from-reading`
- ✅ Lưu vào activity log

---

## 🌐 4. Language Toggle (Đang phát triển)

Tính năng này sẽ cho phép bạn:

- Hover chuột lên từ vựng để xem nghĩa tiếng Việt
- Toggle giữa hiển thị EN/VI trong chế độ ôn tập
- Tùy chỉnh cách hiển thị khi review

**Sẽ được hoàn thiện trong bản cập nhật tiếp theo**

---

## 🔥 Tips & Best Practices

### Để học từ vựng hiệu quả:

1. **Học đều đặn**: Dùng Flashcard mỗi ngày 15-20 phút
2. **Kiểm tra thường xuyên**: Làm Quiz 2-3 lần/tuần
3. **Lưu từ ngay**: Khi gặp từ mới trong reading, hãy lưu ngay
4. **Ưu tiên từ yếu**: Tập trung vào Flashcard - Từ yếu
5. **Sử dụng ví dụ**: Luôn thêm câu ví dụ để nhớ context

### Quy trình học đề xuất:

```
Ngày 1-3: Thêm từ mới (10-15 từ/ngày)
         ↓
Ngày 4-7: Flashcard - Từ mới + Quiz trắc nghiệm
         ↓
Tuần 2+: Flashcard - Tất cả từ + Quiz hỗn hợp
         ↓
Hằng tuần: Review từ yếu với Flashcard - Từ yếu
```

---

## 📊 Tracking Progress

Hệ thống tự động theo dõi:

- **Mastery Level** (0-5): Độ thành thạo của mỗi từ
  - 0-1: Từ mới / khó
  - 2-3: Đang học
  - 4-5: Đã thành thạo

- **Review Count**: Số lần bạn đã ôn từ đó
- **Last Reviewed**: Lần cuối ôn tập
- **Activity Log**: Tất cả hoạt động học từ vựng

Xem thống kê trong:

- Dashboard → **📚 Từ vựng đã học**
- Vocabulary Tab → Từng từ có gắn tag trạng thái

---

## 🐛 Troubleshooting

### Tooltip không hiện khi select text?

- Đảm bảo bạn đang select trong khu vực passage hoặc flashcard
- Chỉ select 1-3 từ (không quá dài)
- Refresh trang nếu vẫn không hoạt động

### Dịch tự động không hoạt động?

- Kiểm tra kết nối internet
- API MyMemory có thể có giới hạn requests
- Dùng tính năng "Nhập thủ công" thay thế

### Flashcard không lưu progress?

- Nhớ đánh giá độ thành thạo (1, 2, 3) sau khi lật thẻ
- Không thoát giữa chừng (dùng nút Thoát)

---

## 🎯 Future Features (Upcoming)

- [ ] Spaced Repetition System (SRS)
- [ ] Thống kê chi tiết theo thời gian
- [ ] Xuất/nhập Anki decks
- [ ] Text-to-speech cho phát âm
- [ ] Gamification với điểm, streak, achievements
- [ ] Vocabulary groups/categories tùy chỉnh
- [ ] AI suggestions cho từ nên học tiếp theo

---

## 📞 Support

Nếu gặp vấn đề hoặc có góp ý, hãy:

- Kiểm tra console (F12) để xem errors
- Thử refresh trang hoặc clear cache
- Backup data trước khi thử nghiệm tính năng mới

Chúc bạn học từ vựng hiệu quả! 🚀
