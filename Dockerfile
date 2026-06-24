# Stage 1: Base image - dùng Node.js 20 Alpine (nhỏ gọn)
FROM node:20-alpine

# Thư mục làm việc bên trong container
WORKDIR /app

# Copy package.json trước để tận dụng Docker cache
# Nếu package.json không đổi, Docker sẽ dùng cache thay vì npm install lại
COPY package*.json ./

# Cài dependencies (chỉ production, không cài devDependencies)
RUN npm install --omit=dev

# Copy toàn bộ source code vào container
COPY . .

# Expose port 3000 để bên ngoài có thể kết nối
EXPOSE 3000

# Lệnh chạy app
CMD ["node", "src/app.js"]
