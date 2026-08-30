const { supabaseAdmin } = require('../config/supabase');

/**
 * Create a new activity log entry
 */
const createActivityLog = async ({
  userId,
  username,
  action,
  resourceType,
  resourceId = null,
  details = null,
  ipAddress = null,
  userAgent = null,
  status = 'success'
}) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .insert([{
        user_id: userId,
        username,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: ipAddress,
        user_agent: userAgent,
        status
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating activity log:', error);
      return { error };
    }

    return { data };
  } catch (error) {
    console.error('Create activity log error:', error);
    return { error };
  }
};

/**
 * Get activity logs with filters and pagination
 */
const getActivityLogs = async ({
  page = 1,
  limit = 50,
  userId = null,
  action = null,
  resourceType = null,
  status = null,
  startDate = null,
  endDate = null,
  search = null
}) => {
  try {
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('activity_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    if (search) {
      query = query.or(`username.ilike.%${search}%,action.ilike.%${search}%,resource_type.ilike.%${search}%`);
    }

    // Apply pagination and ordering
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching activity logs:', error);
      return { error };
    }

    return {
      data,
      count,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    console.error('Get activity logs error:', error);
    return { error };
  }
};

/**
 * Get activity log by ID
 */
const getActivityLogById = async (id) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching activity log:', error);
      return { error };
    }

    return { data };
  } catch (error) {
    console.error('Get activity log by ID error:', error);
    return { error };
  }
};

/**
 * Get activity statistics
 */
const getActivityStats = async ({ startDate = null, endDate = null }) => {
  try {
    let query = supabaseAdmin
      .from('activity_logs')
      .select('action, resource_type, status, created_at');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching activity stats:', error);
      return { error };
    }

    // Calculate statistics
    const stats = {
      total: data.length,
      byAction: {},
      byResourceType: {},
      byStatus: {
        success: 0,
        failure: 0,
        warning: 0
      },
      recentActivity: []
    };

    data.forEach(log => {
      // Count by action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

      // Count by resource type
      stats.byResourceType[log.resource_type] = (stats.byResourceType[log.resource_type] || 0) + 1;

      // Count by status
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
    });

    // Get recent activity (last 10)
    stats.recentActivity = data.slice(0, 10);

    return { data: stats };
  } catch (error) {
    console.error('Get activity stats error:', error);
    return { error };
  }
};

/**
 * Delete old activity logs (for maintenance)
 */
const deleteOldActivityLogs = async (daysToKeep = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Error deleting old activity logs:', error);
      return { error };
    }

    return { data };
  } catch (error) {
    console.error('Delete old activity logs error:', error);
    return { error };
  }
};

module.exports = {
  createActivityLog,
  getActivityLogs,
  getActivityLogById,
  getActivityStats,
  deleteOldActivityLogs
};
