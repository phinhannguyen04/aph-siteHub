Thêm chức năng xóa Website trong frontend Next.js tại src/APH.SiteHub.Ui (chỉ sửa trong thư mục này; KHÔNG sửa backend). Đọc src/APH.SiteHub.Ui/AGENTS.md trước.
Backend sẽ có endpoint `DELETE /api/websites/{id}` (cùng cơ chế CSRF/cookie như DELETE /api/accounts/{id}; trả 404 nếu không tồn tại).
Bám sát cách Accounts đang làm xóa (components/accounts/delete-dialog.tsx, components/common/confirm.tsx, lib/api/accounts.ts):
1. lib/api/websites.ts: thêm deleteWebsite(id) tương tự deleteAccount.
2. components/websites/card.tsx: thêm icon-button xóa (DeleteOutline) cạnh nút sửa (bút chì) ở góc phải card, có aria-label.
3. Thêm dialog xác nhận xóa (nêu tên website), dùng pending state/error box như account delete; sau khi xóa thành công invalidate query danh sách + count website (badge trên sidebar) và nếu trang hiện tại trống thì lùi về trang trước.
4. Text UI đặt trong lib/copy.ts (tiếng Anh), không hard-code.
5. Thêm test (tests/contracts.test.ts và/hoặc tests/ui.spec.ts) theo mẫu đang có.
Chạy biome lint/format, typecheck và unit test của package (xem package.json), đảm bảo pass. Không commit. Cuối cùng báo cáo ngắn các file đã đổi và kết quả.
