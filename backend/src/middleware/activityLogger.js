const { createActivityLog } = require('../repositories/activityLogRepository');

/**
 * Middleware to automatically log activities
 * This middleware logs successful API requests
 */
const activityLogger = (options = {}) => {
  const {
    // Which actions to log (default: all)
    actions = ['POST', 'PUT', 'PATCH', 'DELETE'],
    // Whether to log GET requests (default: false, as they can be noisy)
    logGetRequests = false,
    // Paths to exclude from logging
    excludePaths = ['/api/health', '/api/activity-logs']
  } = options;

  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;

    // Override send function to log after response
    res.send = function (data) {
      // Restore original send
      res.send = originalSend;

      // Log the activity if conditions are met
      const shouldLog = 
        req.user && // User must be authenticated
        (logGetRequests || actions.includes(req.method)) && // Method should be logged
        !excludePaths.some(path => req.path.startsWith(path)) && // Path not excluded
        res.statusCode < 400; // Only log successful requests

      if (shouldLog) {
        // Determine action and resource from the request
        const { action, resourceType, resourceId } = extractActivityInfo(req);

        // Log activity asynchronously (don't block response)
        setImmediate(async () => {
          try {
            await createActivityLog({
              userId: req.user.id,
              username: req.user.username || req.user.email,
              action,
              resourceType,
              resourceId,
              details: extractDetails(req, res),
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('user-agent'),
              status: res.statusCode < 300 ? 'success' : 'warning'
            });
          } catch (error) {
            console.error('Failed to log activity:', error);
            // Don't throw error - logging failure shouldn't break the app
          }
        });
      }

      // Send the response
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Extract activity information from request
 */
function extractActivityInfo(req) {
  const method = req.method;
  const path = req.path;
  
  // Parse path to determine resource type and ID
  const pathParts = path.split('/').filter(p => p);
  
  // Remove 'api' prefix if present
  if (pathParts[0] === 'api') {
    pathParts.shift();
  }
  
  const resourceType = pathParts[0] || 'unknown';
  const resourceId = pathParts[1] && !isNaN(pathParts[1]) ? pathParts[1] : 
                     pathParts[1] && pathParts[1].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? pathParts[1] : 
                     null;
  
  // Determine action based on method and path
  let action = '';
  
  if (path.includes('/login')) {
    action = 'login';
  } else if (path.includes('/logout')) {
    action = 'logout';
  } else if (path.includes('/register')) {
    action = 'register';
  } else {
    // Standard CRUD operations
    switch (method) {
      case 'POST':
        action = `${resourceType}_create`;
        break;
      case 'PUT':
      case 'PATCH':
        action = `${resourceType}_update`;
        break;
      case 'DELETE':
        action = `${resourceType}_delete`;
        break;
      case 'GET':
        action = `${resourceType}_view`;
        break;
      default:
        action = `${resourceType}_${method.toLowerCase()}`;
    }
  }
  
  return { action, resourceType, resourceId };
}

/**
 * Extract relevant details from request and response
 */
function extractDetails(req, res) {
  const details = {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode
  };
  
  // Add query params if present (exclude sensitive data)
  if (req.query && Object.keys(req.query).length > 0) {
    const safeQuery = { ...req.query };
    delete safeQuery.password;
    delete safeQuery.token;
    details.query = safeQuery;
  }
  
  // Add request body info (exclude sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const safeBody = { ...req.body };
    delete safeBody.password;
    delete safeBody.token;
    delete safeBody.accessToken;
    details.body = safeBody;
  }
  
  return details;
}

/**
 * Manual activity logging helper
 * Use this to manually log specific activities
 */
const logActivity = async (req, { action, resourceType, resourceId, details, status = 'success' }) => {
  try {
    if (!req.user) {
      console.warn('Cannot log activity: No authenticated user');
      return;
    }

    await createActivityLog({
      userId: req.user.id,
      username: req.user.username || req.user.email,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      status
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

module.exports = {
  activityLogger,
  logActivity
};
