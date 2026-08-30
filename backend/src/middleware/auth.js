const { supabase, supabaseAdmin } = require('../config/supabase');

/**
 * Middleware to verify JWT token from Supabase
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('Auth header received:', authHeader ? 'Bearer token present' : 'No auth header');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Returning 401: No token provided');
      return res.status(401).json({ error: 'No token provided', message: 'Authorization header missing or invalid' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('Token verification failed:', error?.message);
      return res.status(401).json({ error: 'Invalid or expired token', message: error?.message || 'Token validation failed' });
    }

    console.log('User authenticated:', user.email);

    // Fetch user profile with role information using admin client to bypass RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('Profile not found, using metadata for user:', user.email);
      // If profile not found, create a minimal profile from user metadata
      const minimalProfile = {
        id: user.id,
        email: user.email,
        username: user.email?.split('@')[0] || 'user',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: user.user_metadata?.role || 'user',
        apartment_number: user.user_metadata?.apartment_number || null,
        created_at: user.created_at
      };
      
      // Attach user and profile to request
      req.user = { ...user, ...minimalProfile, role: minimalProfile.role };
      req.profile = minimalProfile;
      
      console.log('User role from metadata:', minimalProfile.role);
      next();
      return;
    }

    // Attach user and profile to request
    req.user = { ...user, ...profile, role: profile.role };
    req.profile = profile;
    
    console.log('User role from profile:', profile.role);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

/**
 * Middleware to check if user has admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.profile || req.profile.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

/**
 * Middleware to check if user has admin or manager role
 */
const requireAdminOrManager = (req, res, next) => {
  if (!req.profile || !['admin', 'manager'].includes(req.profile.role)) {
    return res.status(403).json({ 
      error: 'Access denied. Admin or Manager privileges required.' 
    });
  }
  next();
};

/**
 * Middleware to check if user is an employee (accountant, cashier, administrative)
 */
const requireEmployee = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.profile?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user has an active employee record
    const { supabaseAdmin } = require('../config/supabase');
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !employee) {
      return res.status(403).json({ 
        error: 'Access denied. Employee privileges required.' 
      });
    }

    // Attach employee data to request
    req.employee = employee;
    next();
  } catch (error) {
    console.error('Employee check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user is an accountant
 */
const requireAccountant = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.profile?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { supabaseAdmin } = require('../config/supabase');
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'accountant')
      .eq('status', 'active')
      .single();

    if (error || !employee) {
      return res.status(403).json({ 
        error: 'Access denied. Accountant privileges required.' 
      });
    }

    req.employee = employee;
    next();
  } catch (error) {
    console.error('Accountant check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user has accounting role
 * Accounting role has access to bills, payments, and financial reports
 */
const requireAccounting = (req, res, next) => {
  if (!req.profile || req.profile.role !== 'accounting') {
    return res.status(403).json({ 
      error: 'Access denied. Accounting privileges required.' 
    });
  }
  next();
};

/**
 * Middleware to check if user has admin or accounting role
 * Useful for financial management routes
 */
const requireAdminOrAccounting = (req, res, next) => {
  if (!req.profile || !['admin', 'accounting'].includes(req.profile.role)) {
    return res.status(403).json({ 
      error: 'Access denied. Admin or Accounting privileges required.' 
    });
  }
  next();
};

/**
 * Middleware to check if user is a cashier
 */
const requireCashier = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.profile?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { supabaseAdmin } = require('../config/supabase');
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'cashier')
      .eq('status', 'active')
      .single();

    if (error || !employee) {
      return res.status(403).json({ 
        error: 'Access denied. Cashier privileges required.' 
      });
    }

    req.employee = employee;
    next();
  } catch (error) {
    console.error('Cashier check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireAdminOrManager,
  requireAccounting,
  requireAdminOrAccounting,
  requireEmployee,
  requireAccountant,
  requireCashier
};
