# Nhiệm vụ: Xây dựng giao diện APH SiteHub bằng Next.js + MUI + Biome

## 1. Bối cảnh

APH SiteHub là dashboard nội bộ, **chỉ có một quản trị viên duy nhất** (đăng nhập bằng mật khẩu, không có username). App quản lý:

- **Websites**: danh sách website kèm tag, có tìm kiếm, lọc theo tag, phân trang.
- **Tags**: nhãn có tên, mô tả, màu, dùng để gắn vào website.
- **Accounts**: tài khoản của các provider bên ngoài (login, email, password, secret key mã hóa, cờ bị giới hạn).
- **Auth**: đăng nhập, đăng xuất, đổi mật khẩu quản trị.

Backend là ASP.NET Core 10 Minimal API (đã hoàn chỉnh, **không được sửa**) tại `src/APH.SiteHub.Api`. Hiện có một frontend Vue cũ tại `frontend/`. Bạn có thể đọc nó để tham khảo UX, nhưng **không sửa và không copy component** của nó.

Đọc các file sau trước khi bắt đầu, coi chúng là nguồn sự thật về API:

- `README.md` (mục "API contract")
- `src/APH.SiteHub.Api/Endpoints/*.cs` (route, field body được chấp nhận)
- `src/APH.SiteHub.Api/Endpoints/WebsiteListQueryParser.cs` (query string của website list)
- `src/APH.SiteHub.Application/Features/**/Contracts/*.cs` (shape response)
- `src/APH.SiteHub.Application/Common/Validation/Normalize.cs` và các `*Handler.cs` (rule validation)
- `src/APH.SiteHub.Api/Security/Sessions.cs`, `CsrfFilter.cs` (cookie, Origin, CSRF)
- `frontend/src/api.ts` (client cũ, tham khảo cách gọi API)

## 2. Phạm vi và ràng buộc

- Chỉ tạo/sửa file trong `src/APH.SiteHub.Ui/` (hiện đang trống). Không sửa backend, `frontend/`, file gốc của repo hay `docker-compose*.yml`.
- **Không tự bịa endpoint.** Chỉ dùng các endpoint liệt kê ở mục 4. Ví dụ: backend **không có** endpoint xóa website, nên UI không được có nút xóa website.
- Package manager: **Bun** (repo đang dùng Bun). Tạo `package.json` riêng cho `src/APH.SiteHub.Ui`.
- Stack bắt buộc:
  - **Next.js** bản stable mới nhất, App Router, TypeScript `strict`.
  - **MUI** (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`), tích hợp App Router qua `@mui/material-nextjs` (`AppRouterCacheProvider`). Được dùng `@mui/x-data-grid` (bản MIT) cho dạng bảng nếu cần.
  - **Biome** (v2) cho lint + format. **Không** cài ESLint hay Prettier trong package này. Tắt ESLint trong quá trình build của Next.
  - Data fetching: khuyến nghị `@tanstack/react-query`. Không thêm thư viện UI/CSS khác (không Tailwind, không shadcn).
- Ngôn ngữ text trên UI: **tiếng Anh** (giống UI cũ và message lỗi của backend). Gom text vào một chỗ để sau này dịch được.

## 3. Kiến trúc kết nối API (quan trọng, đọc kỹ)

Cơ chế bảo mật của backend quyết định kiến trúc frontend:

- Session là cookie `admin_session`, `HttpOnly`, `SameSite=Strict`, **`Path=/api`**. Trình duyệt chỉ gửi cookie này tới `/api/*`, nên **Next server (RSC, middleware cho route trang) không đọc được session**. Vì vậy:
  - Kiểm tra đăng nhập và gọi API phải chạy **phía client** (`"use client"`), thông qua `fetch('/api/...', { credentials: 'same-origin' })`.
  - Không chặn route trang bằng Next middleware dựa trên cookie.
- Mọi request phải **same-origin**. Backend kiểm tra header `Origin` khớp chính xác `APP_ORIGIN` (mặc định `http://localhost:8111`) cho login và mọi mutation.
  - Dev: chạy Next ở port **8111** (`next dev -p 8111`, cho override bằng env `SITEHUB_DEV_PORT`).
  - Cấu hình `rewrites` trong `next.config.ts` để proxy `/api/:path*` và `/health` tới backend `SITEHUB_DEV_API_TARGET` (mặc định `http://localhost:${API_PORT ?? 3000}`).
  - **Không tạo Route Handler nào dưới `app/api/`** vì sẽ đè lên rewrite.
- **CSRF**: login, `GET /api/auth/session` và change-password trả về `{ csrfToken }`. Giữ token **chỉ trong memory** (React context/module state, không localStorage/sessionStorage). Gửi header `x-csrf-token` cho mọi request không phải GET. Sau khi đổi mật khẩu thì thay bằng token mới.
- Khởi động app: gọi `GET /api/auth/session`. Thành công thì lưu token và vào app. Nếu 401 thì hiện màn hình login.
- Bất kỳ response 401 nào ở giữa phiên (session hết hạn sau 8 giờ, hoặc mật khẩu đổi ở nơi khác) phải xóa state, xóa cache query và đưa về màn login kèm thông báo.
- JSON: field entity dùng **snake_case**. Riêng `csrfToken`, `pageSize` (response website list), `currentPassword` và `newPassword` (body change-password) dùng camelCase.
- Body request bị backend kiểm tra rất chặt: **field lạ, field trùng, sai kiểu hay `null` ở field không cho phép null đều bị trả 400**. Chỉ gửi đúng các field liệt kê. Ở PATCH thì **bỏ hẳn field không đổi** (không gửi `null`, không gửi `undefined` dưới dạng chuỗi).
- Lỗi luôn có dạng `{ "error": { "code": string, "message": string } }`. Viết một API client typed trả về kiểu discriminated result `{ ok: true, data } | { ok: false, error: { code, message, status } }`. Lỗi mạng map thành `NETWORK_ERROR`, status 0.

| HTTP | Code | Cách UI xử lý |
| ---- | ---- | ------------- |
| 400 | `VALIDATION_ERROR` | Hiện `message` cạnh form hoặc trong snackbar |
| 401 | `UNAUTHORIZED` | Về màn login (riêng login/change-password thì hiện "Incorrect password" ngay tại form) |
| 403 | `FORBIDDEN` | "Invalid session or request origin", gợi ý tải lại trang |
| 404 | `NOT_FOUND` | Thông báo bản ghi không còn tồn tại, refetch danh sách |
| 409 | `CONFLICT` | Trùng tên tag, hoặc trùng cặp provider + external ID. Hiện message ở form |
| 429 | `RATE_LIMITED` | Login bị khóa 15 phút sau 5 lần sai. Hiện cảnh báo rõ ràng |
| 503 | `DATABASE_UNAVAILABLE` | Banner lỗi kèm nút thử lại |

## 4. API contract

### Types (TypeScript)

```ts
type Tag = { id: string; name: string; description: string; color: string; created_at: string; updated_at: string }
type Website = { id: string; name: string; url: string; tag_ids: string[]; tags: Tag[]; created_at: string; updated_at: string }
type WebsitePage = { websites: Website[]; total: number; page: number; pageSize: number }
type Account = { id: string; provider: string; login_name: string; external_account_id: string; email: string; is_limit: boolean; created_at: string }
type ProviderStats = { provider: string; total: number; limited: number; unlimited: number }
type AccountStats = { total: number; limited: number; unlimited: number; providers: ProviderStats[] }
```

Các timestamp đều là chuỗi ISO 8601 UTC. Hiển thị theo giờ local.

### Auth

| Method | Path | Body | Response |
| ------ | ---- | ---- | -------- |
| POST | `/api/auth/login` | `{ password }` | `{ csrfToken }` + set cookie |
| GET | `/api/auth/session` | none | `{ csrfToken }` |
| POST | `/api/auth/logout` | none | `{ ok: true }` |
| POST | `/api/auth/change-password` | `{ currentPassword, newPassword }` | `{ csrfToken }` + cookie mới |

Đổi mật khẩu thành công sẽ làm vô hiệu các session cũ trên thiết bị khác.

### Websites

| Method | Path | Body / Query | Response |
| ------ | ---- | ------------ | -------- |
| GET | `/api/websites` | query: `page` (≥1, mặc định 1), `pageSize` (1–48, mặc định 12), `search` (≤160 ký tự), `tagIds` (UUID cách nhau bằng dấu phẩy, ≤50) | `WebsitePage` |
| GET | `/api/websites/count` | none | `{ count }` (tổng toàn bộ website) |
| POST | `/api/websites` | `{ name, url, tag_ids? }` | 201 `{ website }` |
| PATCH | `/api/websites/{id}` | ít nhất một trong `name`, `url`, `tag_ids` | `{ website }` |

Lưu ý về query string: chỉ chấp nhận đúng 4 key trên. Mỗi key xuất hiện tối đa một lần. Số không được có số 0 ở đầu. **Không gửi `search=` hay `tagIds=` khi rỗng.** Lọc `tagIds` theo logic "có ít nhất một tag được chọn". Backend tự bỏ dấu tiếng Việt khi tìm kiếm. Thứ tự `tag_ids` gửi lên chính là thứ tự hiển thị tag.

### Tags

| Method | Path | Body | Response |
| ------ | ---- | ---- | -------- |
| GET | `/api/tags` | none | `{ tags }` |
| POST | `/api/tags` | `{ name, color, description? }` (`description` có thể là `null`) | 201 `{ tag }` |
| PATCH | `/api/tags/{id}` | `{ name, color, description? }`, **gửi đủ name và color** (cập nhật toàn bộ) | `{ tag }` |
| DELETE | `/api/tags/{id}` | none | `{ ok: true }` |

### Accounts

| Method | Path | Body | Response |
| ------ | ---- | ---- | -------- |
| GET | `/api/accounts` | none | `{ accounts }` (toàn bộ, không phân trang) |
| GET | `/api/accounts/stats` | none | `{ stats: AccountStats }` |
| GET | `/api/accounts/{id}` | none | `{ account }` |
| POST | `/api/accounts` | `{ provider, login_name, external_account_id, email, password, secret_key, is_limit? }` | 201 `{ account }` |
| PATCH | `/api/accounts/{id}` | chỉ `password?`, `secret_key?`, `is_limit?` | `{ account }` |
| GET | `/api/accounts/{id}/secret-key` | none | `{ secret_key }` (no-store) |
| DELETE | `/api/accounts/{id}` | none | `{ ok: true }` |

Response account **không bao giờ chứa password hay secret**. Secret chỉ lấy được qua endpoint `secret-key`. Password đã lưu thì không đọc lại được.

## 5. Rule validation phía client (khớp với backend)

Validate trên client để báo lỗi sớm, nhưng vẫn phải hiển thị lỗi từ server.

- **Login password**: 1–256 ký tự.
- **New admin password**: 12–256 ký tự, phải khác mật khẩu hiện tại. Thêm ô "Confirm new password" (chỉ kiểm tra ở client).
- **Website name**: bắt buộc, sau khi trim tối đa 160 ký tự.
- **Website URL**: bắt buộc, ≤2048 ký tự, phải là URL tuyệt đối `http`/`https`, có host, **không chứa user:password@**. Backend sẽ chuẩn hóa URL (ví dụ thêm `/` ở cuối), nên hiển thị giá trị server trả về.
- **Website tag_ids**: tối đa 50, không trùng.
- **Tag name**: bắt buộc, bỏ dấu `#` ở đầu, tối đa 64 ký tự. Không phân biệt hoa thường khi xét trùng (409).
- **Tag description**: tối đa 240 ký tự, không bắt buộc.
- **Tag color**: đúng định dạng `#rrggbb` (6 chữ số hex).
- **Account**: `provider`, `login_name`, `external_account_id`, `password`, `secret_key` đều bắt buộc và không được rỗng. `email` phải hợp lệ và có dấu `.`.

## 6. Màn hình và chức năng

### 6.1 Layout chung (sau khi đăng nhập)

- MUI `AppBar` + `Drawer` điều hướng. Trên desktop Drawer luôn mở, trên mobile là drawer tạm thời có nút menu.
- Mục điều hướng: **Websites** (`/`, kèm badge số từ `/api/websites/count`), **Accounts** (`/accounts`).
- Trong Drawer có nút **Manage tags** (mở dialog quản lý tag), **Change password** và **Sign out**.
- Toggle light/dark/system, lưu lựa chọn vào localStorage (đây là thứ duy nhất được lưu localStorage).
- Snackbar toàn cục cho thông báo thành công/lỗi.
- Trang 404 tùy chỉnh (`not-found.tsx`).

### 6.2 Login

- Một form ở giữa màn hình: tên app, ô password (có nút hiện/ẩn), nút Sign in có trạng thái loading.
- Hiện lỗi sai mật khẩu, cảnh báo bị khóa 15 phút (429) và lỗi mạng.
- Đăng nhập xong thì quay lại route trước đó.

### 6.3 Websites (`/`)

- Thanh công cụ gồm ô tìm kiếm (debounce khoảng 300ms), bộ lọc tag (Autocomplete multi-select hiển thị chip theo màu tag), nút "Add website".
- **Đồng bộ state lên URL**: `?page=&pageSize=&search=&tagIds=` để reload hoặc chia sẻ link vẫn giữ nguyên bộ lọc. Đổi search hoặc tag thì reset về trang 1.
- Hiển thị dạng **lưới card** responsive. Mỗi card có: tên, domain/URL (link mở tab mới với `rel="noopener noreferrer"`), favicon (có thể lấy từ domain, có fallback icon), chip tag theo đúng thứ tự, thời gian cập nhật, nút sửa và nút copy URL.
- Phân trang bằng MUI `Pagination` + chọn page size (12/24/48). Hiển thị "Showing X–Y of total".
- Trạng thái: skeleton khi đang tải; empty state khi chưa có website; empty state khác khi không có kết quả lọc (kèm nút xóa bộ lọc); trạng thái lỗi kèm nút thử lại.
- **Dialog Create/Edit website**: name, URL, tag picker cho phép chọn nhiều và **sắp xếp lại thứ tự** (kéo thả hoặc nút lên/xuống), cho tạo tag nhanh ngay trong picker. Khi edit thì PATCH chỉ những field thay đổi. Nếu không có gì thay đổi thì disable nút Save.
- Sau khi tạo hoặc sửa: invalidate list và count.

### 6.4 Manage tags (dialog hoặc drawer bên phải)

- Danh sách tag gồm chấm màu, tên, mô tả, và nút sửa/xóa.
- Form tạo/sửa: name, description (đếm ký tự /240), color (bảng màu gợi ý + ô nhập hex + preview chip).
- Xóa phải có dialog xác nhận, cảnh báo rằng tag sẽ bị gỡ khỏi các website đang dùng nó.
- Sau khi thay đổi: invalidate tags và website list.

### 6.5 Accounts (`/accounts`)

- **Thống kê** (từ `/api/accounts/stats`): card Total / Limited / Unlimited, và breakdown theo provider (card nhỏ hoặc bar ngang đơn giản dùng MUI `LinearProgress`, không thêm thư viện chart).
- Toolbar: ô tìm kiếm **lọc phía client** (provider, login_name, email, external_account_id), lọc theo provider, lọc theo trạng thái (All/Limited/Unlimited), nút Refresh, nút "Add account".
- Hai chế độ hiển thị **List (card)** và **Table**, có toggle. Bảng sắp xếp được theo cột, có giới hạn trạng thái hiển thị bằng chip màu.
- **Chi tiết account** (Drawer bên phải, lấy dữ liệu từ `GET /api/accounts/{id}`): hiển thị toàn bộ field, có nút copy cho login_name, email và external ID.
  - **Secret key**: mặc định ẩn (`••••••`). Nút "Reveal" mới gọi `GET /secret-key`. Hiện kèm nút copy và **tự ẩn sau 30 giây** hoặc khi đóng drawer. Không đưa secret vào React Query cache lâu dài (`gcTime: 0`), không log, không lưu storage.
  - Password không xem được. Chỉ có hành động "Set new password".
- **Create account**: form đầy đủ các field, password và secret dùng ô kiểu password có nút hiện/ẩn, có switch `is_limit`.
- **Edit account**: chỉ cho sửa `password`, `secret_key`, `is_limit`. Các field khác hiển thị read-only. Để trống thì không đổi (không gửi field đó).
- **Delete**: dialog xác nhận, yêu cầu gõ lại `login_name` để tránh xóa nhầm.
- Sau mutation: invalidate list và stats.

### 6.6 Change password (dialog)

- Gồm các ô current password, new password (hiện rule ≥12 ký tự, thanh độ mạnh đơn giản) và confirm.
- Thành công: cập nhật CSRF token mới, hiện thông báo "Other sessions have been signed out".

## 7. Yêu cầu về thiết kế và chất lượng

- Theme MUI tùy biến (`createTheme` với `colorSchemes` light/dark, `cssVariables: true`). Màu primary trung tính và chuyên nghiệp, typography rõ ràng, bo góc và khoảng cách nhất quán. Giao diện kiểu dashboard admin gọn gàng, không lòe loẹt.
- Responsive từ 360px tới desktop rộng. Không có scroll ngang trên mobile. Bảng trên mobile chuyển sang dạng card.
- Accessibility: mọi icon button có `aria-label`; focus khi mở/đóng dialog đúng; form dùng label và helper text; tôn trọng `prefers-reduced-motion`.
- Disable nút submit và hiện loading trong khi đang gửi. Chặn double-submit.
- Chip tag: chọn màu chữ tương phản tự động theo màu nền.

## 8. Cấu trúc gợi ý

```text
src/APH.SiteHub.Ui/
  package.json, biome.json, next.config.ts, tsconfig.json, .gitignore, README.md
  src/
    app/            layout.tsx, page.tsx (websites), accounts/page.tsx, login/page.tsx, not-found.tsx
    components/     layout/, websites/, tags/, accounts/, auth/, common/
    lib/api/        client.ts (fetch + CSRF + error), types.ts, websites.ts, tags.ts, accounts.ts, auth.ts
    lib/auth/       session context, hook useSession, component <RequireAuth>
    lib/validation/ các rule ở mục 5
    theme/          theme.ts
```

Mỗi file nên có một trách nhiệm rõ ràng. Component trang mỏng, logic nằm ở hook hoặc `lib`.

## 9. Biome và scripts

- `biome.json`: bật formatter (2 spaces, single quotes, không dùng semicolon, trailing comma `all`, line width 100, LF, giống `.prettierrc.json` ở gốc repo), bật linter với rule recommended, bật organize imports, bỏ qua `.next` và `node_modules`.
- Scripts trong `package.json`:
  - `dev`: `next dev -p ${SITEHUB_DEV_PORT:-8111}` (hoặc tương đương, chạy được bằng Bun)
  - `build`, `start`
  - `lint`: `biome lint .`
  - `format`: `biome format --write .`
  - `check`: `biome check .`
  - `typecheck`: `tsc --noEmit`
- `README.md` ngắn cho UI: cách chạy dev với backend, các biến môi trường và kiến trúc proxy `/api`.

## 10. Tiêu chí hoàn thành

Trước khi báo xong, chạy và đảm bảo **tất cả đều pass**, không còn warning của Biome:

```bash
cd src/APH.SiteHub.Ui
bun install
bun run check
bun run typecheck
bun run build
```

Checklist chức năng (tự kiểm tra lại với code):

- [ ] Vào app khi chưa đăng nhập thì thấy màn login. Đăng nhập đúng thì vào app. Sai 5 lần thì thấy thông báo khóa.
- [ ] Mọi request không phải GET đều có `x-csrf-token`. Không có token nào nằm trong storage.
- [ ] Websites: tìm kiếm, lọc tag, phân trang, đổi page size, đồng bộ URL, tạo và sửa (kèm thứ tự tag) đều hoạt động. Không có nút xóa website.
- [ ] Tags: tạo, sửa, xóa. Lỗi 409 khi trùng tên hiển thị đúng chỗ.
- [ ] Accounts: stats, lọc client, list/table, chi tiết, reveal secret tự ẩn, tạo, sửa (chỉ 3 field), xóa có xác nhận.
- [ ] Change password cập nhật CSRF token mới. 401 bất kỳ đều đưa về login.
- [ ] Không có file nào ngoài `src/APH.SiteHub.Ui/` bị thay đổi.

Khi xong, báo cáo ngắn gọn: cấu trúc đã tạo, các quyết định thiết kế chính, kết quả các lệnh kiểm tra, và mọi điểm bạn phải giả định hoặc chưa làm được.
