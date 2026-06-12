/**
 * Unit tests for scheduler service (Challenge 10)
 */

// Mock các dependencies để tránh kết nối DB thật
jest.mock('../src/models/enrollment.model', () => ({
  findAll: jest.fn(),
}));
jest.mock('../src/models/class.model', () => ({}));
jest.mock('../src/models/user.model', () => ({
  User: {},
}));
jest.mock('../src/services/email.service', () => ({
  sendReminderEmail: jest.fn(),
}));
jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({ start: jest.fn() }),
}));

const Enrollment = require('../src/models/enrollment.model');
const { sendReminderEmail } = require('../src/services/email.service');
const { sendDailyReminders, getCronStatus, startCronJob } = require('../src/services/scheduler.service');

describe('Scheduler Service - Challenge 10', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getCronStatus trả về object đúng cấu trúc', () => {
    const status = getCronStatus();
    expect(status).toHaveProperty('isRunning');
    expect(status).toHaveProperty('lastRun');
    expect(status).toHaveProperty('lastResult');
    expect(status).toHaveProperty('totalSent');
    expect(status).toHaveProperty('totalFailed');
  });

  test('startCronJob khởi động cron với node-cron', () => {
    const cron = require('node-cron');
    startCronJob();
    expect(cron.schedule).toHaveBeenCalledWith(
      '0 0 * * *',
      expect.any(Function),
      { timezone: 'UTC' }
    );
  });

  test('sendDailyReminders không gửi email khi không có enrollment', async () => {
    Enrollment.findAll.mockResolvedValue([]);
    await sendDailyReminders();
    expect(sendReminderEmail).not.toHaveBeenCalled();
  });

  test('sendDailyReminders gửi email cho học viên có lớp active', async () => {
    sendReminderEmail.mockResolvedValue(true);
    Enrollment.findAll.mockResolvedValue([
      {
        student: { id: 'user-1', name: 'Duy Loi', email: 'duyloi@test.com', role: 'student' },
        class: { id: 1, name: 'Node.js Buoi 1', start_date: '2026-06-01', end_date: '2026-06-30', status: 'active' },
      },
    ]);

    await sendDailyReminders();
    expect(sendReminderEmail).toHaveBeenCalledTimes(1);
    expect(sendReminderEmail).toHaveBeenCalledWith(
      'duyloi@test.com',
      'Nhắc nhở lớp học hôm nay 📚',
      expect.stringContaining('Duy Loi')
    );
  });

  test('sendDailyReminders xử lý lỗi gửi email, không crash', async () => {
    sendReminderEmail.mockRejectedValue(new Error('SendGrid error'));
    Enrollment.findAll.mockResolvedValue([
      {
        student: { id: 'user-1', name: 'Test', email: 'test@test.com', role: 'student' },
        class: { id: 1, name: 'Class 1', start_date: null, end_date: null, status: 'active' },
      },
    ]);

    await expect(sendDailyReminders()).resolves.not.toThrow();
    const status = getCronStatus();
    expect(status.totalFailed).toBeGreaterThan(0);
  });

  test('sendDailyReminders bỏ qua user không có class', async () => {
    Enrollment.findAll.mockResolvedValue([
      {
        student: { id: 'user-2', name: 'No Class', email: 'noclass@test.com', role: 'student' },
        class: null,
      },
    ]);

    await sendDailyReminders();
    expect(sendReminderEmail).not.toHaveBeenCalled();
  });

  test('sendDailyReminders cập nhật lastRun sau khi chạy', async () => {
    Enrollment.findAll.mockResolvedValue([]);
    const before = new Date().toISOString();
    await sendDailyReminders();
    const status = getCronStatus();
    expect(status.lastRun).not.toBeNull();
    expect(new Date(status.lastRun) >= new Date(before)).toBe(true);
  });

});
