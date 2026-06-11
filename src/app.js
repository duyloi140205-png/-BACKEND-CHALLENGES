const express = require('express');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware xử lý trước khi vào Route
app.use(express.json()); // Đọc dữ liệu JSON
app.use(morgan('dev'));  // Ghi log API calls

// Routes
const authRoutes  = require('./routes/auth.route');   // Challenge 3: Register/Login/Profile
const otpRoutes   = require('./routes/otp.route');    // Challenge 4: Send-OTP/Verify-OTP
const classRoutes      = require('./routes/class.route');      // Challenge 2: CRUD Classes
const courseRoutes     = require('./routes/course.route');     // Challenge 2: CRUD Courses
const enrollmentRoutes = require('./routes/enrollment.route'); // Challenge 6: Enrollment

app.use('/api/auth',        authRoutes);
app.use('/api/auth',        otpRoutes);
app.use('/api/classes',     classRoutes);
app.use('/api/courses',     courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            violations: [{ field: 'file', message: 'File quá lớn, tối đa 2MB' }]
        });
    }
    // Multer file type error
    if (err.message === 'Chỉ chấp nhận file CSV') {
        return res.status(400).json({
            violations: [{ field: 'file', message: err.message }]
        });
    }
    // Multer boundary error (không có file)
    if (err.message && err.message.includes('Boundary not found')) {
        return res.status(400).json({
            violations: [{ field: 'file', message: 'Vui lòng upload file CSV' }]
        });
    }
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 3000;
const sequelize = require('./config/database');

// Kết nối DB và chạy server
sequelize.sync()
    .then(() => {
        console.log('✅ Database synced!');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Unable to sync database:', err);
    });

module.exports = app;