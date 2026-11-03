Thêm chức năng xóa Website vào backend ASP.NET (chỉ sửa trong src/APH.SiteHub.Api, Application, Infrastructure và tests/APH.SiteHub.Tests; KHÔNG đụng src/APH.SiteHub.Ui).
Làm đúng theo mẫu của DeleteAccount (src/APH.SiteHub.Application/Features/Accounts/DeleteAccount/*, AccountRepository.DeleteAsync, AccountEndpoints.DeleteAccountAsync, đăng ký trong Application/DependencyInjection.cs):
1. Features/Websites/DeleteWebsite/DeleteWebsiteCommand.cs + DeleteWebsiteHandler.cs (not found -> Error.Missing("Website")).
2. Thêm DeleteAsync(string id, CancellationToken) vào IWebsiteRepository và WebsiteRepository (ExecuteDeleteAsync; FK website_tags đã cascade).
3. Đăng ký handler trong DI; thêm group.MapDelete("/{id}", ...) trong WebsiteEndpoints, trả cùng kiểu response như DeleteAccountAsync.
4. Thêm test trong ApiTests.cs: xóa thành công, xóa id không tồn tại -> 404, website_tags bị xóa theo, yêu cầu CSRF/đăng nhập như các endpoint khác.
5. Cập nhật README.md mục API contract nếu có liệt kê endpoint.
Chạy `dotnet build` và `dotnet test` cho tests/APH.SiteHub.Tests, đảm bảo pass. Không commit. Cuối cùng báo cáo ngắn các file đã đổi và kết quả test.
