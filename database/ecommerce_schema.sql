-- =============================================
-- ECOMMERCE SYSTEM - DATABASE SCHEMA
-- PostgreSQL
-- =============================================
-- Cập nhật theo yêu cầu leader:
--   1. Thêm jti_salt UUID vào user_auth (ngăn access token phiên login cũ)
--   2. Bỏ bảng cart, gộp user_id/coupon_id/created_at/updated_at vào cart_item
--   3. Đem coupon_id từ orders sang order_item (mỗi item có coupon riêng)
-- =============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
    id              BIGSERIAL       PRIMARY KEY,
    email           VARCHAR(254)    NOT NULL UNIQUE,
    phone           VARCHAR(20)     UNIQUE,
    full_name       VARCHAR(150)    NOT NULL,
    avatar_url      TEXT,
    role            VARCHAR(20)     NOT NULL DEFAULT 'customer'
                        CHECK (role IN ('customer', 'admin', 'staff')),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    is_verified     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Tách password hash ra bảng riêng để bảo mật
-- jti_salt: UUID mới mỗi lần login, dùng để vô hiệu hóa token phiên cũ
-- Khi gen access_token: mapping jti_salt + user_id vào token
-- Middleware check: nếu jti_salt trong token không khớp DB → chặn lại
CREATE TABLE user_auth (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    password_hash   VARCHAR(255)    NOT NULL,
    jti_salt        UUID            NOT NULL DEFAULT gen_random_uuid(),
    last_login_at   TIMESTAMPTZ,
    refresh_token   TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- 1 user có nhiều địa chỉ giao hàng
CREATE TABLE address (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name       VARCHAR(150)    NOT NULL,
    phone           VARCHAR(20)     NOT NULL,
    province        VARCHAR(100)    NOT NULL,
    district        VARCHAR(100)    NOT NULL,
    ward            VARCHAR(100)    NOT NULL,
    street          TEXT            NOT NULL,
    is_default      BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. CATEGORY
-- ─────────────────────────────────────────────
CREATE TABLE category (
    id              BIGSERIAL       PRIMARY KEY,
    parent_id       BIGINT          REFERENCES category(id) ON DELETE SET NULL,
    name            VARCHAR(150)    NOT NULL,
    slug            VARCHAR(170)    NOT NULL UNIQUE,
    description     TEXT,
    image_url       TEXT,
    sort_order      INT             NOT NULL DEFAULT 0,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. PRODUCT
-- CRUD:
--   CREATE : INSERT INTO product (category_id, name, slug, base_price, ...) VALUES (...)
--   READ   : SELECT * FROM product WHERE status = 'active'
--   UPDATE : UPDATE product SET name = ?, price = ? WHERE id = ?
--   DELETE : UPDATE product SET status = 'archived' WHERE id = ? (soft delete)
-- ─────────────────────────────────────────────
CREATE TABLE product (
    id              BIGSERIAL       PRIMARY KEY,
    category_id     BIGINT          NOT NULL REFERENCES category(id),
    name            VARCHAR(300)    NOT NULL,
    slug            VARCHAR(320)    NOT NULL UNIQUE,
    description     TEXT,
    base_price      NUMERIC(15,2)   NOT NULL CHECK (base_price >= 0),
    sale_price      NUMERIC(15,2)   CHECK (sale_price >= 0),
    brand           VARCHAR(100),
    tags            TEXT[],
    status          VARCHAR(20)     NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'active', 'archived')),
    is_featured     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_sale_price CHECK (sale_price IS NULL OR sale_price <= base_price)
);

CREATE TABLE product_image (
    id              BIGSERIAL       PRIMARY KEY,
    product_id      BIGINT          NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    url             TEXT            NOT NULL,
    alt_text        VARCHAR(255),
    sort_order      INT             NOT NULL DEFAULT 0,
    is_primary      BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE product_variant (
    id              BIGSERIAL       PRIMARY KEY,
    product_id      BIGINT          NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    sku             VARCHAR(100)    NOT NULL UNIQUE,
    attributes      JSONB           NOT NULL DEFAULT '{}',
    price_override  NUMERIC(15,2)   CHECK (price_override >= 0),
    weight_gram     INT             CHECK (weight_gram > 0),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. WAREHOUSE
-- CRUD:
--   CREATE : INSERT INTO warehouse (name, code, province, district, address) VALUES (...)
--   READ   : SELECT * FROM warehouse WHERE is_active = TRUE
--   UPDATE : UPDATE warehouse SET name = ?, phone = ? WHERE id = ?
--   DELETE : UPDATE warehouse SET is_active = FALSE WHERE id = ? (soft delete)
-- ─────────────────────────────────────────────
CREATE TABLE warehouse (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(150)    NOT NULL,
    code            VARCHAR(50)     NOT NULL UNIQUE,
    province        VARCHAR(100)    NOT NULL,
    district        VARCHAR(100)    NOT NULL,
    address         TEXT            NOT NULL,
    phone           VARCHAR(20),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. INVENTORY
-- ─────────────────────────────────────────────
CREATE TABLE inventory (
    id              BIGSERIAL       PRIMARY KEY,
    variant_id      BIGINT          NOT NULL REFERENCES product_variant(id) ON DELETE CASCADE,
    warehouse_id    BIGINT          NOT NULL REFERENCES warehouse(id) ON DELETE CASCADE,
    quantity        INT             NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved        INT             NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    reorder_level   INT             NOT NULL DEFAULT 5,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (variant_id, warehouse_id),
    CONSTRAINT chk_reserved CHECK (reserved <= quantity)
);

CREATE TABLE inventory_log (
    id              BIGSERIAL       PRIMARY KEY,
    inventory_id    BIGINT          NOT NULL REFERENCES inventory(id),
    changed_by      BIGINT          REFERENCES users(id),
    change_type     VARCHAR(30)     NOT NULL
                        CHECK (change_type IN ('import', 'export', 'adjustment', 'reserved', 'released')),
    quantity_before INT             NOT NULL,
    quantity_after  INT             NOT NULL,
    delta           INT             NOT NULL,
    note            TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. COUPON
-- ─────────────────────────────────────────────
CREATE TABLE coupon (
    id              BIGSERIAL       PRIMARY KEY,
    code            VARCHAR(50)     NOT NULL UNIQUE,
    description     TEXT,
    discount_type   VARCHAR(20)     NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value  NUMERIC(15,2)   NOT NULL CHECK (discount_value > 0),
    max_discount    NUMERIC(15,2),
    min_order_value NUMERIC(15,2)   NOT NULL DEFAULT 0,
    usage_limit     INT,
    used_count      INT             NOT NULL DEFAULT 0,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    starts_at       TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_coupon_dates CHECK (expires_at IS NULL OR starts_at IS NULL OR expires_at > starts_at),
    CONSTRAINT chk_percent_max  CHECK (discount_type != 'percent' OR discount_value <= 100)
);

-- ─────────────────────────────────────────────
-- 7. CART_ITEM
-- Bỏ bảng cart riêng, gộp thẳng vào cart_item
-- user_id / session_id xác định giỏ của ai
-- coupon_id áp dụng cho item này
-- ─────────────────────────────────────────────
CREATE TABLE cart_item (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          REFERENCES users(id) ON DELETE CASCADE,
    session_id      VARCHAR(128),
    variant_id      BIGINT          NOT NULL REFERENCES product_variant(id),
    quantity        INT             NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price      NUMERIC(15,2)   NOT NULL CHECK (unit_price >= 0),
    coupon_id       BIGINT          REFERENCES coupon(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, variant_id),
    CONSTRAINT chk_cart_owner CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- ─────────────────────────────────────────────
-- 8. ORDERS
-- coupon_id đã chuyển sang order_item
-- ─────────────────────────────────────────────
CREATE TABLE orders (
    id                  BIGSERIAL       PRIMARY KEY,
    order_number        VARCHAR(30)     NOT NULL UNIQUE,
    user_id             BIGINT          NOT NULL REFERENCES users(id),
    address_id          BIGINT          REFERENCES address(id) ON DELETE SET NULL,
    shipping_name       VARCHAR(150)    NOT NULL,
    shipping_phone      VARCHAR(20)     NOT NULL,
    shipping_address    TEXT            NOT NULL,
    subtotal            NUMERIC(15,2)   NOT NULL CHECK (subtotal >= 0),
    discount_amount     NUMERIC(15,2)   NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_fee        NUMERIC(15,2)   NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
    total_amount        NUMERIC(15,2)   NOT NULL CHECK (total_amount >= 0),
    status              VARCHAR(30)     NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','confirmed','processing','shipping','delivered','completed','cancelled','refunded')),
    note                TEXT,
    cancelled_reason    TEXT,
    confirmed_at        TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_total CHECK (total_amount = subtotal - discount_amount + shipping_fee)
);

-- coupon_id ở đây để mỗi item có thể áp dụng coupon riêng
-- không dùng chung ở orders tránh ảnh hưởng các items khác
CREATE TABLE order_item (
    id              BIGSERIAL       PRIMARY KEY,
    order_id        BIGINT          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id      BIGINT          REFERENCES product_variant(id) ON DELETE SET NULL,
    coupon_id       BIGINT          REFERENCES coupon(id) ON DELETE SET NULL,
    product_name    VARCHAR(300)    NOT NULL,
    variant_sku     VARCHAR(100)    NOT NULL,
    variant_attrs   JSONB           NOT NULL DEFAULT '{}',
    unit_price      NUMERIC(15,2)   NOT NULL CHECK (unit_price >= 0),
    quantity        INT             NOT NULL CHECK (quantity > 0),
    subtotal        NUMERIC(15,2)   NOT NULL CHECK (subtotal >= 0),
    CONSTRAINT chk_item_subtotal CHECK (subtotal = unit_price * quantity)
);

-- ─────────────────────────────────────────────
-- 9. SHIPMENT
-- ─────────────────────────────────────────────
CREATE TABLE shipment (
    id                  BIGSERIAL       PRIMARY KEY,
    order_id            BIGINT          NOT NULL UNIQUE REFERENCES orders(id),
    warehouse_id        BIGINT          REFERENCES warehouse(id) ON DELETE SET NULL,
    carrier             VARCHAR(100),
    tracking_number     VARCHAR(100),
    shipping_method     VARCHAR(50)     DEFAULT 'standard'
                            CHECK (shipping_method IN ('standard','express','same_day')),
    estimated_at        TIMESTAMPTZ,
    shipped_at          TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    status              VARCHAR(30)     NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','picked_up','in_transit','delivered','failed','returned')),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 10. PAYMENT
-- partner: tên đối tác cổng thanh toán (thêm theo yêu cầu leader)
-- ─────────────────────────────────────────────
CREATE TABLE payment (
    id                  BIGSERIAL       PRIMARY KEY,
    order_id            BIGINT          NOT NULL REFERENCES orders(id),
    transaction_id      VARCHAR(100)    UNIQUE,
    method              VARCHAR(50)     NOT NULL
                            CHECK (method IN ('cod','bank_transfer','credit_card','momo','zalopay','vnpay','payos')),
    partner             VARCHAR(100),
    amount              NUMERIC(15,2)   NOT NULL CHECK (amount > 0),
    currency            CHAR(3)         NOT NULL DEFAULT 'VND',
    status              VARCHAR(30)     NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','processing','success','failed','cancelled','refunded')),
    gateway_response    JSONB,
    paid_at             TIMESTAMPTZ,
    refunded_at         TIMESTAMPTZ,
    refund_amount       NUMERIC(15,2)   CHECK (refund_amount >= 0),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 11. REVIEW
-- ─────────────────────────────────────────────
CREATE TABLE review (
    id              BIGSERIAL       PRIMARY KEY,
    product_id      BIGINT          NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    order_item_id   BIGINT          REFERENCES order_item(id) ON DELETE SET NULL,
    rating          SMALLINT        NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title           VARCHAR(200),
    body            TEXT,
    is_verified     BOOLEAN         NOT NULL DEFAULT FALSE,
    is_visible      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, order_item_id)
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX idx_users_email            ON users(email);
CREATE INDEX idx_users_role             ON users(role);
CREATE INDEX idx_user_auth_jti          ON user_auth(jti_salt);
CREATE INDEX idx_address_user           ON address(user_id);
CREATE INDEX idx_category_parent        ON category(parent_id);
CREATE INDEX idx_category_slug          ON category(slug);
CREATE INDEX idx_product_category       ON product(category_id);
CREATE INDEX idx_product_status         ON product(status);
CREATE INDEX idx_product_slug           ON product(slug);
CREATE INDEX idx_product_tags           ON product USING GIN(tags);
CREATE INDEX idx_variant_product        ON product_variant(product_id);
CREATE INDEX idx_variant_attrs          ON product_variant USING GIN(attributes);
CREATE INDEX idx_inventory_variant      ON inventory(variant_id);
CREATE INDEX idx_inventory_warehouse    ON inventory(warehouse_id);
CREATE INDEX idx_cart_item_user         ON cart_item(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_cart_item_session      ON cart_item(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_orders_user            ON orders(user_id);
CREATE INDEX idx_orders_status          ON orders(status);
CREATE INDEX idx_orders_created         ON orders(created_at DESC);
CREATE INDEX idx_order_item_order       ON order_item(order_id);
CREATE INDEX idx_order_item_coupon      ON order_item(coupon_id);
CREATE INDEX idx_payment_order          ON payment(order_id);
CREATE INDEX idx_payment_status         ON payment(status);
CREATE INDEX idx_payment_partner        ON payment(partner);
CREATE INDEX idx_shipment_order         ON shipment(order_id);
CREATE INDEX idx_review_product         ON review(product_id);
CREATE INDEX idx_coupon_code            ON coupon(code);
CREATE INDEX idx_coupon_active          ON coupon(is_active, expires_at);
CREATE INDEX idx_warehouse_code         ON warehouse(code);
CREATE INDEX idx_warehouse_active       ON warehouse(is_active);
