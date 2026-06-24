/**
 * Generate HTML email template cho reminder học viên
 * @param {Object} data - { studentName, classes }
 * @returns {string} HTML string
 */
const getReminderEmailHtml = ({ studentName, classes }) => {
  const classRows = classes.map((cls) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${cls.name}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${cls.start_date || 'N/A'}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${cls.end_date || 'N/A'}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nhắc nhở lớp học hôm nay</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        
        <h2 style="color: #2c3e50; margin-bottom: 8px;">📚 Nhắc nhở lớp học hôm nay</h2>
        <p style="color: #666; margin-top: 0;">Xin chào <strong>${studentName}</strong>,</p>
        
        <p style="color: #555;">Đây là danh sách các lớp học bạn đã đăng ký. Chúc bạn học tốt!</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #3498db; color: white;">
              <th style="padding: 10px 12px; text-align: left;">Tên lớp</th>
              <th style="padding: 10px 12px; text-align: left;">Ngày bắt đầu</th>
              <th style="padding: 10px 12px; text-align: left;">Ngày kết thúc</th>
            </tr>
          </thead>
          <tbody>
            ${classRows}
          </tbody>
        </table>

        <p style="color: #888; font-size: 13px; margin-top: 30px;">
          Email này được gửi tự động lúc 7:00 sáng (UTC+7) mỗi ngày.<br>
          Vui lòng không trả lời email này.
        </p>
      </div>
    </body>
    </html>
  `;
};

module.exports = { getReminderEmailHtml };
