/**
 * Role-based authorization middleware
 * Usage: roleMiddleware('admin') or roleMiddleware('admin', 'instructor')
 */
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user && req.user.role;

    if (!userRole) {
      console.warn(`[WARN] Role check failed - no role in token: ${req.method} ${req.originalUrl} at ${new Date().toISOString()}`);
      return res.status(403).json({
        violations: [{ message: 'Không xác định được quyền truy cập.' }]
      });
    }

    if (!allowedRoles.includes(userRole)) {
      console.warn(`[WARN] Access denied - role "${userRole}" not in [${allowedRoles}]: ${req.method} ${req.originalUrl} at ${new Date().toISOString()}`);
      return res.status(403).json({
        violations: [{ message: `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: ${allowedRoles.join(' hoặc ')}` }]
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
