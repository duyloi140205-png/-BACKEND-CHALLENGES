# Database Analysis - Online Learning System

## Overview
Hệ thống đào tạo trực tuyến sử dụng PostgreSQL với 6 bảng chính.

## Tables

### 1. Roles
Quản lý phân quyền người dùng.
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Primary key |
| name | VARCHAR(50) | Tên role: admin, instructor, student |
| description | TEXT | Mô tả role |
| created_at | TIMESTAMP | Thời gian tạo |

### 2. Users
Thông tin người dùng hệ thống.
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Primary key |
| full_name | VARCHAR(100) | Họ tên |
| email | VARCHAR(100) | Email đăng nhập (unique) |
| phone | VARCHAR(20) | Số điện thoại |
| role_id | INT FK | Liên kết Roles |
| is_active | BOOLEAN | Trạng thái tài khoản |

### 3. User_Auth
Lưu thông tin xác thực (tách riêng để bảo mật).
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Primary key |
| user_id | INT FK | Liên kết Users (unique) |
| password_hash | VARCHAR(255) | Mật khẩu đã hash |
| last_login | TIMESTAMP | Lần đăng nhập cuối |

### 4. Courses
Thông tin khóa học.
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Primary key |
| title | VARCHAR(200) | Tên khóa học |
| instructor_id | INT FK | Giảng viên (liên kết Users) |
| price | DECIMAL(10,2) | Giá khóa học |
| is_published | BOOLEAN | Đã xuất bản chưa |

### 5. Classes
Các bài học trong khóa học.
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Primary key |
| course_id | INT FK | Liên kết Courses |
| title | VARCHAR(200) | Tên bài học |
| video_url | TEXT | Link video |
| order_index | INT | Thứ tự bài học |

### 6. Enrollments
Đăng ký khóa học của học viên.
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Primary key |
| user_id | INT FK | Liên kết Users |
| course_id | INT FK | Liên kết Courses |
| enrolled_at | TIMESTAMP | Thời gian đăng ký |
| completed_at | TIMESTAMP | Thời gian hoàn thành |

## Relationships
- Users **belongs to** Roles (nhiều user cùng 1 role)
- User_Auth **belongs to** Users (1-1)
- Courses **belongs to** Users/instructor (1 instructor - nhiều course)
- Classes **belongs to** Courses (1 course - nhiều class)
- Enrollments **connects** Users và Courses (nhiều-nhiều)

## Normalization
Database đạt chuẩn **3NF**:
- 1NF: Tất cả cột có giá trị nguyên tử
- 2NF: Không có phụ thuộc hàm một phần
- 3NF: Không có phụ thuộc hàm bắc cầu