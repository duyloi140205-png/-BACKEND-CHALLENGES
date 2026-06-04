const express = require('express');
const morgan = require('morgan');
require('dotenv').config();

const courseRoutes = require('./routes/course.route');
const classRoutes = require('./routes/class.route');

const app = express();

// Middleware xử lý trước khi vào Route
app.use(express.json()); // Đọc dữ liệu JSON
app.use(morgan('dev'));  // Ghi log API calls

const authRoutes = require('./routes/auth.route');

// Routes
app.use('/api/courses', courseRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/auth', authRoutes);
// Global Error Handler (Xử lý lỗi toàn cục)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 3000;
const sequelize = require('./config/database');

// Kết nối DB và chạy server
sequelize.sync({ force: false })
    .then(() => {
        console.log('Database synced!');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Unable to sync database:', err);
    });

module.exports = app;