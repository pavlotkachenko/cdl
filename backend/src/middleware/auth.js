// ============================================
// Authentication Middleware
// ============================================
// This is like a security guard checking IDs
// before letting people into different rooms

const { supabase } = require('../config/supabase');

/**
 * Verify JWT token from request
 * Checks if the user is logged in
 */
async function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    // Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided. Please log in.' 
      });
    }
    
    // Extract token (remove "Bearer " prefix)
    const token = authHeader.substring(7);
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token. Please log in again.' 
      });
    }
    
    // Get full user details from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
    
    if (userError || !userData) {
      return res.status(404).json({ 
        error: 'User not found in database' 
      });
    }
    
    // Attach user to request object
    // Now other functions can access req.user
    req.user = userData;
    req.token = token;
    
    next(); // Continue to next function
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed' 
    });
  }
}

/**
 * Check if user has required role
 * Usage: authorize(['admin', 'operator'])
 */
function authorize(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Not authenticated' 
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
      });
    }
    
    next();
  };
}

/**
 * Check if user can access specific case
 * Drivers can only see their own cases
 * Operators can see cases assigned to them
 * Attorneys can see cases assigned to them
 * Admins can see everything
 */
async function canAccessCase(req, res, next) {
  try {
    const caseId = req.params.caseId || req.params.id;
    const user = req.user;
    
    // Admin can access everything
    if (user.role === 'admin') {
      return next();
    }
    
    // Get the case
    const { data: caseData, error } = await supabase
      .from('cases')
      .select('driver_id, assigned_operator_id, assigned_attorney_id')
      .eq('id', caseId)
      .single();
    
    if (error || !caseData) {
      return res.status(404).json({ 
        error: 'Case not found' 
      });
    }
    
    // Check access based on role
    let hasAccess = false;
    
    switch (user.role) {
      case 'driver':
        hasAccess = caseData.driver_id === user.id;
        break;
      case 'operator':
        hasAccess = caseData.assigned_operator_id === user.id;
        break;
      case 'attorney':
        hasAccess = caseData.assigned_attorney_id === user.id;
        break;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'You do not have permission to access this case' 
      });
    }
    
    // Attach case data to request
    req.caseData = caseData;
    next();
    
  } catch (error) {
    console.error('Case access check error:', error);
    return res.status(500).json({ 
      error: 'Failed to verify case access' 
    });
  }
}

module.exports = {
  authenticate,
  authorize,
  canAccessCase
};
