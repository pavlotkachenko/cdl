/**
 * CDL Messaging System - Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Extend Express Request type to include user information
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        auth_user_id: string;
      };
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch user details from database
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, email, role, auth_user_id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userRecord) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    // Attach user to request
    req.user = userRecord;

    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Authorization middleware - checks user role
 */
export function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Optional authentication - does not fail if token is missing
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      const { data: userRecord } = await supabase
        .from('users')
        .select('id, email, role, auth_user_id')
        .eq('auth_user_id', user.id)
        .single();

      if (userRecord) {
        req.user = userRecord;
      }
    }

    next();
  } catch (err) {
    console.error('Optional auth error:', err);
    next();
  }
}
