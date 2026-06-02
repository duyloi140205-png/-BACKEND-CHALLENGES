-- =============================================
-- SAMPLE DATA - ONLINE LEARNING SYSTEM
-- =============================================

-- 1. ROLES
INSERT INTO Roles (name, description) VALUES
('admin', 'System administrator'),
('instructor', 'Course instructor'),
('student', 'Student learner');

-- 2. USERS
INSERT INTO Users (full_name, email, phone, role_id) VALUES
('Admin System', 'admin@elearning.com', '0900000001', 1),
('Nguyen Van A', 'instructor1@elearning.com', '0900000002', 2),
('Tran Thi B', 'instructor2@elearning.com', '0900000003', 2),
('Le Van C', 'student1@elearning.com', '0900000004', 3),
('Pham Thi D', 'student2@elearning.com', '0900000005', 3),
('Hoang Van E', 'student3@elearning.com', '0900000006', 3),
('Nguyen Thi F', 'student4@elearning.com', '0900000007', 3),
('Tran Van G', 'student5@elearning.com', '0900000008', 3),
('Le Thi H', 'student6@elearning.com', '0900000009', 3),
('Pham Van I', 'student7@elearning.com', '0900000010', 3);

-- 3. USER_AUTH
INSERT INTO User_Auth (user_id, password_hash) VALUES
(1, '$2a$10$hashedpassword1'),
(2, '$2a$10$hashedpassword2'),
(3, '$2a$10$hashedpassword3'),
(4, '$2a$10$hashedpassword4'),
(5, '$2a$10$hashedpassword5'),
(6, '$2a$10$hashedpassword6'),
(7, '$2a$10$hashedpassword7'),
(8, '$2a$10$hashedpassword8'),
(9, '$2a$10$hashedpassword9'),
(10, '$2a$10$hashedpassword10');

-- 4. COURSES
INSERT INTO Courses (title, description, instructor_id, price, is_published) VALUES
('C# .NET Core Basics', 'Learn C# and .NET Core from scratch', 2, 499000, TRUE),
('Advanced SQL & PostgreSQL', 'Deep dive into SQL and PostgreSQL', 2, 699000, TRUE),
('Web API Development', 'Build REST APIs with .NET Core', 3, 799000, TRUE),
('Git & GitHub for Developers', 'Version control best practices', 3, 299000, TRUE);

-- 5. CLASSES
INSERT INTO Classes (course_id, title, video_url, duration_minutes, order_index) VALUES
(1, 'Introduction to C#', 'https://video.url/1', 30, 1),
(1, 'Variables and Data Types', 'https://video.url/2', 45, 2),
(1, 'Control Flow', 'https://video.url/3', 40, 3),
(2, 'SQL Basics', 'https://video.url/4', 35, 1),
(2, 'Advanced Queries', 'https://video.url/5', 50, 2),
(3, 'REST API Concepts', 'https://video.url/6', 30, 1),
(3, 'Building Controllers', 'https://video.url/7', 60, 2),
(4, 'Git Fundamentals', 'https://video.url/8', 25, 1),
(4, 'Branching Strategy', 'https://video.url/9', 35, 2);

-- 6. ENROLLMENTS
INSERT INTO Enrollments (user_id, course_id) VALUES
(4, 1), (4, 2),
(5, 1), (5, 3),
(6, 2), (6, 4),
(7, 1), (7, 3),
(8, 2), (8, 4),
(9, 1), (9, 4),
(10, 3);