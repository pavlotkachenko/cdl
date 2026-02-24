// ============================================
// AUTHENTICATION MIDDLEWARE
// JWT token verification for protected routes
// ============================================

const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

/**
 * Authenticate JWT token
 * Verifies token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token expired'
        });
      }
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }

    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id || decoded.sub)
      .single();

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'User account is inactive'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Authorize specific roles
 * Use after authenticate middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Optional authentication
 * Attaches user if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id || decoded.sub)
        .single();

      if (user && user.is_active) {
        req.user = user;
      }
    } catch (error) {
      // Invalid token, but that's ok for optional auth
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

/**
 * Check if user can access a specific case
 * Allows access if user is admin, the case creator, assigned operator, or assigned attorney
 */
const canAccessCase = async (req, res, next) => {
  try {
    const caseId = req.params.id;

    if (!caseId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Case ID is required'
      });
    }

    // Admins can access any case
    if (req.user.role === 'admin') {
      return next();
    }

    const { data: caseData, error } = await supabase
      .from('cases')
      .select('created_by, operator_id, attorney_id')
      .eq('id', caseId)
      .single();

    if (error || !caseData) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Case not found'
      });
    }

    const userId = req.user.id;
    const hasAccess =
      caseData.created_by === userId ||
      caseData.operator_id === userId ||
      caseData.attorney_id === userId;

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this case'
      });
    }

    next();
  } catch (error) {
    console.error('canAccessCase error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Access check failed'
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  canAccessCase,
  optionalAuth
};
