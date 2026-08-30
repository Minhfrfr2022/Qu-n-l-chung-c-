const {
  createActivityLog,
  getActivityLogs,
  getActivityLogById,
  getActivityStats,
  deleteOldActivityLogs
} = require('../repositories/activityLogRepository');

/**
 * Get all activity logs with filters and pagination
 * GET /api/activity-logs
 */
const getAllActivityLogs = async (req, res) => {
  try {
    console.log('getAllActivityLogs called by:', req.user?.email, 'role:', req.user?.role);
    
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resourceType,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    const result = await getActivityLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      userId,
      action,
      resourceType,
      status,
      startDate,
      endDate,
      search
    });

    console.log('Activity logs result:', { 
      success: !result.error, 
      dataLength: result.data?.length,
      pagination: result.pagination 
    });

    if (result.error) {
      console.error('Repository error:', result.error);
      return res.status(500).json({ error: 'Failed to fetch activity logs', message: result.error });
    }

    return res.status(200).json({
      logs: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get all activity logs error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

/**
 * Get activity log by ID
 * GET /api/activity-logs/:id
 */
const getActivityLog = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getActivityLogById(id);

    if (result.error) {
      return res.status(404).json({ error: 'Activity log not found' });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    console.error('Get activity log error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user's own activity logs
 * GET /api/activity-logs/me
 */
const getMyActivityLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50, startDate, endDate } = req.query;

    const result = await getActivityLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      userId,
      startDate,
      endDate
    });

    if (result.error) {
      return res.status(500).json({ error: 'Failed to fetch activity logs' });
    }

    return res.status(200).json({
      logs: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get my activity logs error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get activity statistics
 * GET /api/activity-logs/stats
 */
const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const result = await getActivityStats({ startDate, endDate });

    if (result.error) {
      return res.status(500).json({ error: 'Failed to fetch activity statistics' });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    console.error('Get activity stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create a new activity log (for manual logging if needed)
 * POST /api/activity-logs
 */
const createLog = async (req, res) => {
  try {
    const {
      action,
      resourceType,
      resourceId,
      details,
      status = 'success'
    } = req.body;

    // Validation
    if (!action || !resourceType) {
      return res.status(400).json({ 
        error: 'Action and resource type are required' 
      });
    }

    const result = await createActivityLog({
      userId: req.user.id,
      username: req.user.username || req.user.email,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status
    });

    if (result.error) {
      return res.status(500).json({ error: 'Failed to create activity log' });
    }

    return res.status(201).json(result.data);
  } catch (error) {
    console.error('Create activity log error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete old activity logs (maintenance - admin only)
 * DELETE /api/activity-logs/cleanup
 */
const cleanupOldLogs = async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.query;

    const result = await deleteOldActivityLogs(parseInt(daysToKeep));

    if (result.error) {
      return res.status(500).json({ error: 'Failed to cleanup old logs' });
    }

    return res.status(200).json({ 
      message: `Successfully deleted logs older than ${daysToKeep} days` 
    });
  } catch (error) {
    console.error('Cleanup old logs error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllActivityLogs,
  getActivityLog,
  getMyActivityLogs,
  getStats,
  createLog,
  cleanupOldLogs
};
