// In-memory token blacklist for logout
// In production, use Redis instead
const tokenBlacklist = new Set();

const addToBlacklist = (token) => tokenBlacklist.add(token);
const isBlacklisted = (token) => tokenBlacklist.has(token);

module.exports = { addToBlacklist, isBlacklisted };
