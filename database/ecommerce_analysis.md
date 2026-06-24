# Ecommerce Database Schema – Phân tích & Thiết kế

## Tổng quan — 16 bảng

| Nhóm | Bảng |
|------|------|
| Người dùng | `users`, `user_auth`, `address` |
| Sản phẩm | `category`, `product`, `product_image`, `product_variant` |
| Kho hàng | `warehouse`, `inventory`, `inventory_log` |
| Mua hàng | `cart`, `cart_item`, `coupon` |
| Đơn hàng | `orders`, `order_item` |
| Vận chuyển | `shipment` |
| Thanh toán | `payment` |
| Đánh giá | `review` |

**7 bảng yêu cầu + 9 bảng bổ sung hợp lý**

---

## Sơ đồ quan hệ

```
users ─────┬── user_auth (1-1)
           ├── address (1-N)
           ├── cart (1-1 active)
           └── orders (1-N)

category ──── product (1-N)
              ├── product_image (1-N)
              └── product_variant (1-N)
                      └── inventory (N-N với warehouse)

warehouse ──── inventory

cart ──── cart_item (1-N) ──── product_variant

orders ──── order_item (1-N) ──── product_variant
       ├── payment (1-N)
       └── shipment (1-1)
```

---

## Giải thích từng bảng

### users
Tài khoản người dùng. Role: `customer`, `admin`, `staff`.

### user_auth
Tách password hash ra riêng — khi JOIN thông thường không lộ mật khẩu.
Có `refresh_token` cho JWT refresh flow.

### address
Địa chỉ giao hàng (1 user nhiều địa chỉ). `is_default` đánh dấu địa chỉ mặc định.

### category
Danh mục đa cấp (self-referencing qua `parent_id`).
Ví dụ: Điện tử → Điện thoại → iPhone.

### product
Sản phẩm "cha". Giá thực lấy từ variant.
`tags TEXT[]` + GIN index để tìm kiếm nhanh.
`status`: draft → active → archived.

### product_image
Nhiều ảnh cho 1 sản phẩm. `is_primary` = ảnh đại diện.

### product_variant
Biến thể (màu, size...). Mỗi variant có SKU riêng.
`attributes JSONB` lưu linh hoạt: `{"color":"red","size":"M"}`.

### warehouse
Kho hàng vật lý. Hỗ trợ multi-warehouse (nhiều kho khác nhau).

### inventory
Tồn kho theo `(variant_id, warehouse_id)`.
- `quantity`: tổng hàng
- `reserved`: hàng đã giữ cho đơn đang xử lý
- available = quantity - reserved
- Constraint: `reserved <= quantity` tránh overselling

### inventory_log
Audit trail mọi biến động tồn kho.
Trace lịch sử import/export/điều chỉnh.

### coupon
Mã giảm giá: `percent` hoặc `fixed`.
Kiểm soát qua `usage_limit`, `starts_at`, `expires_at`.

### cart
Giỏ hàng. Hỗ trợ cả user đăng nhập (`user_id`) lẫn guest (`session_id`).
Hết hạn sau 7 ngày.

### cart_item
Sản phẩm trong giỏ. `unit_price` là snapshot giá lúc thêm.
`UNIQUE(cart_id, variant_id)` tránh duplicate.

### orders
Đơn hàng. Snapshot địa chỉ giao hàng khi đặt (tránh sai lệch khi user đổi địa chỉ sau).
Luồng: pending → confirmed → processing → shipping → delivered → completed.

### order_item
Dòng sản phẩm trong đơn. Snapshot tên, SKU, giá, thuộc tính tại thời điểm đặt.

### shipment
Thông tin vận chuyển: carrier (GHN/GHTK...), tracking number, shipping method.

### payment
Thanh toán: COD, banking, MoMo, ZaloPay, VNPay...
1 đơn có thể có nhiều lần thử thanh toán.
`gateway_response JSONB` lưu raw response để debug.

### review
Đánh giá sản phẩm. Liên kết `order_item_id` — chỉ review khi đã mua.
`UNIQUE(user_id, order_item_id)` — mỗi lần mua chỉ review 1 lần.

---

## Quyết định thiết kế quan trọng

**1. Snapshot dữ liệu**
Địa chỉ, giá, tên sản phẩm được copy vào `orders`/`order_item` khi đặt hàng.
Đảm bảo đơn hàng lịch sử không bị ảnh hưởng khi user/admin cập nhật sau.

**2. BIGSERIAL thay vì SERIAL**
8 bytes, tránh overflow khi hệ thống scale lớn.

**3. TIMESTAMPTZ thay vì TIMESTAMP**
Timezone-aware, hoạt động đúng khi deploy nhiều timezone.

**4. NUMERIC(15,2) cho tiền tệ**
Không dùng FLOAT — tránh lỗi làm tròn số thực.

**5. GIN index cho JSONB và mảng**
`product.tags[]` và `product_variant.attributes` dùng GIN index để filter nhanh.
