const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Learning System API',
      version: '1.0.0',
      description: 'Backend API cho hệ thống đào tạo trực tuyến - VietProDev Backend Challenges',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token từ API login',
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check' },
      { name: 'Auth', description: 'Đăng ký, đăng nhập, profile, logout' },
      { name: 'OTP', description: 'Gửi và xác thực OTP' },
      { name: 'Courses', description: 'CRUD khóa học, import/export' },
      { name: 'Classes', description: 'CRUD lớp học, bulk enroll' },
      { name: 'Enrollments', description: 'Đăng ký lớp học' },
      { name: 'Roles', description: 'Quản lý phân quyền' },
      { name: 'Cron', description: 'Cron job trạng thái' },
    ],
  },
  apis: ['./src/routes/*.js', './src/app.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
