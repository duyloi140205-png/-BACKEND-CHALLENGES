const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOtpEmail = async (toEmail, otpCode) => {
  const msg = {
    to: toEmail,
    from: process.env.SENDER_EMAIL,
    subject: 'Xác thực tài khoản - Mã OTP',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Xác thực tài khoản</h2>
        <p>Mã OTP của bạn là:</p>
        <h1 style="color: #4CAF50; letter-spacing: 5px;">${otpCode}</h1>
        <p>Mã có hiệu lực trong <strong>5 phút</strong>.</p>
      </div>
    `,
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('SendGrid error:', JSON.stringify(error.response?.body));
    throw error;
  }
};

const sendReminderEmail = async (toEmail, subject, htmlContent) => {
  const msg = {
    to: toEmail,
    from: process.env.SENDER_EMAIL,
    subject,
    html: htmlContent,
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error(`SendGrid reminder error to ${toEmail}:`, JSON.stringify(error.response?.body));
    throw error;
  }
};

module.exports = { sendOtpEmail, sendReminderEmail };