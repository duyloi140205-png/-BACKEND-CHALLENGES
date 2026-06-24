# E-Learning System - Backend API

Hệ thống đào tạo trực tuyến xây dựng bằng **Node.js + Express + PostgreSQL**.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL + Sequelize ORM
- **Auth:** JWT + bcrypt
- **Email:** SendGrid
- **Scheduler:** node-cron
- **Container:** Docker + docker-compose
- **Docs:** Swagger/OpenAPI

## API Documentation

Sau khi chạy server, truy cập: **http://localhost:3000/api-docs**

## Quick Start (Không dùng Docker)

```bash
# 1. Clone repo
git clone <repo-url>
cd BACKEND-CHALLENGES

# 2. Cài dependencies
npm install

# 3. Tạo file .env từ template
cp .env.example .env
# Sửa các giá trị trong .env

# 4. Chạy server
npm run dev
```

## Quick Start (Dùng Docker)

```bash
# 1. Copy .env
cp .env.example .env
# Sửa các giá trị trong .env

# 2. Build và chạy
docker-compose up --build

# 3. Dừng
docker-compose down
```

## Environment Variables

| Biến | Mô tả | Ví dụ |
|------|--------|-------|
| DB_HOST | Host database | localhost |
| DB_PORT | Port database | 5432 |
| DB_NAME | Tên database | backend_challenges |
| DB_USER | User database | postgres |
| DB_PASSWORD | Password database | your_password |
| PORT | Port server | 3000 |
| JWT_SECRET | Secret key JWT | your_secret |
| SENDGRID_API_KEY | API key SendGrid | SG.xxx |
| SENDER_EMAIL | Email gửi | noreply@example.com |

## API Endpoints

### Auth
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | /api/auth/register | Đăng ký | ❌ |
| POST | /api/auth/login | Đăng nhập | ❌ |
| GET | /api/auth/profile | Xem profile | ✅ |
| POST | /api/auth/logout | Đăng xuất | ✅ |
| POST | /api/auth/send-otp | Gửi OTP | ❌ |
| POST | /api/auth/verify-otp | Xác thực OTP | ❌ |

### Courses
| Method | Endpoint | Mô tả | Role |
|--------|----------|-------|------|
| GET | /api/courses | Danh sách (search/filter/pagination) | All |
| GET | /api/courses/:id | Chi tiết | All |
| POST | /api/courses | Tạo mới | admin/instructor |
| PUT | /api/courses/:id | Cập nhật | admin/instructor |
| DELETE | /api/courses/:id | Xóa | admin |
| POST | /api/courses/import | Import CSV | admin/instructor |
| GET | /api/courses/export | Export CSV | admin/instructor |

### Classes
| Method | Endpoint | Mô tả | Role |
|--------|----------|-------|------|
| GET | /api/classes | Danh sách | All |
| POST | /api/classes | Tạo mới | admin/instructor |
| PUT | /api/classes/:id | Cập nhật | admin/instructor |
| DELETE | /api/classes/:id | Xóa | admin |
| POST | /api/classes/:id/bulk-enroll | Bulk enroll | admin/instructor |

### Enrollments
| Method | Endpoint | Mô tả | Role |
|--------|----------|-------|------|
| POST | /api/enrollments | Đăng ký lớp | student |
| DELETE | /api/enrollments/:class_id | Hủy đăng ký | student |
| GET | /api/enrollments/my-classes | Lớp đã đăng ký | student |
| GET | /api/enrollments/:class_id/students | Danh sách học viên | admin/instructor |

### Roles
| Method | Endpoint | Mô tả | Role |
|--------|----------|-------|------|
| GET | /api/roles | Danh sách roles | admin |
| GET | /api/roles/users | Users theo role | admin |
| PUT | /api/roles/assign | Gán role | admin |

### System
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /health | Health check |
| GET | /api-docs | Swagger UI |
| GET | /api/cron/status | Trạng thái cron |
| POST | /api/cron/trigger | Trigger cron thủ công |

## Database Schema

Xem file `database/init.sql` và `database/erd.png`.

## Roles

| Role | Quyền |
|------|-------|
| admin | Toàn quyền |
| instructor | CRUD khóa học/lớp, xem học viên |
| student | Xem, đăng ký lớp |
