const jwt = require('jsonwebtoken');
const Store = require('../utils/dataStore');

const JWT_SECRET = process.env.JWT_SECRET || 'fingoal_hrms_super_secure_jwt_secret_key_2026_finance';

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-user-id']) {
      // Also allow direct header identification
      const user = await Store.findUserById(req.headers['x-user-id']);
      if (user) {
        req.user = user;
        return next();
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required. Please login.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await Store.findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or user not found. Please log in again.'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact your HR administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication session.',
      error: error.message
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of [${roles.join(', ')}] roles.`
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  adminOnly: authorize('admin')
};
