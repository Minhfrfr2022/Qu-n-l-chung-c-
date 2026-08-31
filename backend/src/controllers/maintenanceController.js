const { supabase, supabaseAdmin } = require('../config/supabase');
const { sendPushToUser, sendNotificationToAdmins, PRIORITY, CATEGORY } = require('../services/fcmService');

/**
 * Get all maintenance requests (with filtering for regular users)
 */
exports.getAllRequests = async (req, res) => {
  try {
    const user = req.user;
    let query = supabaseAdmin
      .from('maintenance_requests')
      .select('*')
      .order('created_at', { ascending: false });

    // If user is not admin/manager, filter by their created requests OR their apartment number
    if (user.role !== 'admin' && user.role !== 'manager') {
      if (user.apartment_number) {
        query = query.or(`created_by.eq.${user.id},apt_id.eq.${user.apartment_number}`);
      } else {
        query = query.eq('created_by', user.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        console.warn('maintenance_requests table not found in Supabase. Returning empty data gracefully.');
        return res.json({
          success: true,
          data: [],
          count: 0
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get single maintenance request by ID
 */
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    let query = supabaseAdmin
      .from('maintenance_requests')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Maintenance request not found'
        });
      }
      throw error;
    }

    // Check if user has permission to view this request
    if (user.role !== 'admin' && user.role !== 'manager' && data.created_by !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this request'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching maintenance request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create new maintenance request
 */
exports.createRequest = async (req, res) => {
  try {
    const user = req.user;
    const { apt_id, resident_name, phone, issue_description, priority } = req.body;

    console.log('Creating maintenance request for user:', user.id, user.email);

    // Validation
    if (!apt_id || !resident_name || !issue_description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: apt_id, resident_name, issue_description'
      });
    }

    const newRequest = {
      apt_id,
      resident_name,
      phone: phone || null,
      issue_description,
      priority: priority || 'medium',
      status: 'pending',
      created_by: user.id
    };

    console.log('Inserting maintenance request:', newRequest);

    // Use supabaseAdmin to bypass RLS since we're inserting on behalf of user
    const { data, error } = await supabaseAdmin
      .from('maintenance_requests')
      .insert([newRequest])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    console.log('Maintenance request created:', data.id);

    // Gửi thông báo đến toàn bộ Admin & Manager khi Cư dân tạo đơn mới
    sendNotificationToAdmins({
      type: 'info',
      title: 'Yêu cầu sửa chữa mới',
      message: `Căn hộ ${apt_id} vừa gửi yêu cầu: ${issue_description}`,
      link: '/admin/maintenance',
      metadata: { requestId: data.id, apt_id, priority: data.priority },
      category: CATEGORY.EMERGENCY,
      priority: data.priority === 'high' || data.priority === 'emergency' ? PRIORITY.URGENT : PRIORITY.IMPORTANT,
    }).catch(err => console.error('Failed to notify admins of new maintenance request:', err));

    res.status(201).json({
      success: true,
      data,
      message: 'Maintenance request created successfully'
    });
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update maintenance request (admin/manager can update, user can only update their pending requests)
 */
exports.updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const updates = req.body;

    // First, get the current request
    const { data: currentRequest, error: fetchError } = await supabaseAdmin
      .from('maintenance_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentRequest) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance request not found'
      });
    }

    // Check permissions
    const isAdmin = user.role === 'admin' || user.role === 'manager';
    const isOwner = currentRequest.created_by === user.id;

    if (!isAdmin && (!isOwner || currentRequest.status !== 'pending')) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this request'
      });
    }

    // Users can only update certain fields
    const allowedUserFields = ['issue_description', 'priority', 'phone'];
    const allowedAdminFields = ['status', 'estimated_cost', 'actual_cost', 'notes', 'assigned_to', 'confirmed_at', 'completed_at'];

    let updateData = {};
    
    if (isAdmin) {
      // Admin can update all fields
      Object.keys(updates).forEach(key => {
        if ([...allowedUserFields, ...allowedAdminFields].includes(key)) {
          updateData[key] = updates[key];
        }
      });
    } else {
      // Regular user can only update specific fields
      Object.keys(updates).forEach(key => {
        if (allowedUserFields.includes(key)) {
          updateData[key] = updates[key];
        }
      });
    }

    const { data, error } = await supabaseAdmin
      .from('maintenance_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Gửi thông báo đến Cư dân căn hộ khi Admin chuyển trạng thái
    if (isAdmin && updates.status) {
      const statusText = data.status === 'in_progress' ? 'Đang tiến hành sửa chữa' : data.status === 'confirmed' ? 'Đã xác nhận' : data.status;
      const notifData = {
        type: 'info',
        title: 'Cập nhật tiến độ sửa chữa',
        message: `Yêu cầu sửa chữa căn hộ ${data.apt_id} đã chuyển sang: "${statusText}".`,
        link: '/maintenance',
        metadata: { requestId: data.id, status: data.status },
        category: CATEGORY.ANNOUNCEMENTS,
        priority: PRIORITY.IMPORTANT,
      };

      try {
        const targetUserIds = new Set();
        if (data.created_by) targetUserIds.add(data.created_by);
        if (data.apt_id) {
          const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('apartment_number', data.apt_id);
          if (profiles) profiles.forEach(p => targetUserIds.add(p.id));
        }
        for (const uid of targetUserIds) {
          sendPushToUser(uid, notifData).catch(console.error);
        }
      } catch (err) {
        console.error('Error notifying apartment residents on status update:', err);
      }
    }

    res.json({
      success: true,
      data,
      message: 'Maintenance request updated successfully'
    });
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Confirm maintenance request (admin/manager only)
 */
exports.confirmRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { estimated_cost, notes, assigned_to } = req.body;

    // Check admin permission
    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Only admin or manager can confirm requests'
      });
    }

    const updateData = {
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      estimated_cost: estimated_cost || null,
      notes: notes || null,
      assigned_to: assigned_to || null
    };

    const { data, error } = await supabaseAdmin
      .from('maintenance_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Gửi thông báo đến toàn bộ Cư dân căn hộ khi Admin xác nhận
    try {
      const targetUserIds = new Set();
      if (data.created_by) targetUserIds.add(data.created_by);
      if (data.apt_id) {
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('apartment_number', data.apt_id);
        if (profiles) profiles.forEach(p => targetUserIds.add(p.id));
      }
      for (const uid of targetUserIds) {
        sendPushToUser(uid, {
          type: 'info',
          title: 'Yêu cầu sửa chữa đã được xác nhận',
          message: `Yêu cầu sửa chữa căn hộ ${data.apt_id} đã được tiếp nhận.${data.assigned_to ? ` Thợ phụ trách: ${data.assigned_to}.` : ''}${data.estimated_cost ? ` Dự kiến: ${Number(data.estimated_cost).toLocaleString('vi-VN')} đ.` : ''}`,
          link: '/maintenance',
          metadata: { requestId: data.id, status: 'confirmed' },
          category: CATEGORY.ANNOUNCEMENTS,
          priority: PRIORITY.IMPORTANT,
        }).catch(console.error);
      }
    } catch (notifErr) {
      console.error('Failed to notify resident on confirm:', notifErr);
    }

    res.json({
      success: true,
      data,
      message: 'Maintenance request confirmed successfully'
    });
  } catch (error) {
    console.error('Error confirming maintenance request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Complete maintenance request (admin/manager only)
 * This will also update financial revenue
 */
exports.completeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { actual_cost, notes } = req.body;

    // Check admin permission
    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Only admin or manager can complete requests'
      });
    }

    // Get the request first
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('maintenance_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance request not found'
      });
    }

    const nowIso = new Date().toISOString();
    const periodCalculated = request.period || nowIso.slice(0, 7);

    const updateData = {
      status: 'completed',
      completed_at: nowIso,
      period: periodCalculated,
      actual_cost: finalCost,
      notes: notes || request.notes
    };

    const { data, error } = await supabaseAdmin
      .from('maintenance_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Chi phí sửa chữa được lưu trực tiếp vào maintenance_requests để phục vụ báo cáo Chi phí (Expenses).

    // Gửi thông báo đến toàn bộ Cư dân căn hộ khi hoàn tất sửa chữa
    try {
      const targetUserIds = new Set();
      if (data.created_by) targetUserIds.add(data.created_by);
      if (data.apt_id) {
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('apartment_number', data.apt_id);
        if (profiles) profiles.forEach(p => targetUserIds.add(p.id));
      }
      for (const uid of targetUserIds) {
        sendPushToUser(uid, {
          type: 'success',
          title: 'Hoàn thành sửa chữa căn hộ',
          message: `Yêu cầu sửa chữa căn hộ ${data.apt_id} đã hoàn tất nghiệm thu. Tổng chi phí: ${Number(finalCost).toLocaleString('vi-VN')} đ.`,
          link: '/maintenance',
          metadata: { requestId: data.id, actual_cost: finalCost, status: 'completed' },
          category: CATEGORY.ANNOUNCEMENTS,
          priority: PRIORITY.IMPORTANT,
        }).catch(console.error);
      }
    } catch (notifErr) {
      console.error('Failed to notify resident on complete:', notifErr);
    }

    res.json({
      success: true,
      data,
      message: 'Maintenance request completed successfully',
      revenue_updated: revenueUpdated
    });
  } catch (error) {
    console.error('Error completing maintenance request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete maintenance request (admin only)
 */
exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Check admin permission
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admin can delete requests'
      });
    }

    const { error } = await supabaseAdmin
      .from('maintenance_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Maintenance request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting maintenance request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get statistics for maintenance requests
 */
exports.getStatistics = async (req, res) => {
  try {
    const user = req.user;
    
    let query = supabaseAdmin.from('maintenance_requests').select('*');

    // If not admin, only show user's requests
    if (user.role !== 'admin' && user.role !== 'manager') {
      query = query.eq('created_by', user.id);
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats = {
      total: data.length,
      pending: data.filter(r => r.status === 'pending').length,
      confirmed: data.filter(r => r.status === 'confirmed').length,
      in_progress: data.filter(r => r.status === 'in_progress').length,
      completed: data.filter(r => r.status === 'completed').length,
      total_estimated_cost: data
        .filter(r => r.estimated_cost)
        .reduce((sum, r) => sum + parseFloat(r.estimated_cost), 0),
      total_actual_cost: data
        .filter(r => r.actual_cost)
        .reduce((sum, r) => sum + parseFloat(r.actual_cost), 0)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting maintenance statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
