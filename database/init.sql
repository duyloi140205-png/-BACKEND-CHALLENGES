-- =============================================
-- ONLINE LEARNING SYSTEM - DATABASE SCHEMA
-- =============================================

-- 1. ROLES TABLE
CREATE TABLE Roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS TABLE
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    avatar_url TEXT,
    role_id INT NOT NULL REFERENCES Roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. USER_AUTH TABLE
CREATE TABLE User_Auth (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES Users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. COURSES TABLE
CREATE TABLE Courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    instructor_id INT NOT NULL REFERENCES Users(id),
    price DECIMAL(10,2) DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. CLASSES TABLE
CREATE TABLE Classes (
    id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES Courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    video_url TEXT,
    duration_minutes INT,
    order_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. ENROLLMENTS TABLE
CREATE TABLE Enrollments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(id),
    course_id INT NOT NULL REFERENCES Courses(id),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(user_id, course_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_role ON Users(role_id);
CREATE INDEX idx_courses_instructor ON Courses(instructor_id);
CREATE INDEX idx_enrollments_user ON Enrollments(user_id);
CREATE INDEX idx_enrollments_course ON Enrollments(course_id);
CREATE INDEX idx_classes_course ON Classes(course_id);