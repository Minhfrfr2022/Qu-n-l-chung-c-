const { supabase, supabaseAdmin } = require('../config/supabase');

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

    // If user is not admin/manager, filter by their created requests
    if (user.role !== 'admin' && user.role !== 'manager') {
      query = query.eq('created_by', user.id);
    }

    const { data, error } = await query;

    if (error) throw error;

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

    if (error) throw error;

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

    const finalCost = actual_cost || request.estimated_cost || 0;

    const updateData = {
      status: 'completed',
      completed_at: new Date().toISOString(),
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

    // Update financial revenue if cost > 0
    let revenueUpdated = false;
    if (finalCost > 0 && data.period) {
      try {
        // Create a maintenance revenue payment record
        const paymentData = {
          apt_id: data.apt_id,
          period: data.period,
          amount: finalCost,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'maintenance',
          notes: `Doanh thu từ bảo trì: ${data.issue_description.substring(0, 100)}`,
          created_at: new Date().toISOString()
        };

        const { error: paymentError } = await supabaseAdmin
          .from('payments')
          .insert([paymentData]);

        if (paymentError) {
          console.error('Error adding maintenance revenue:', paymentError);
        } else {
          revenueUpdated = true;
        }
      } catch (revenueError) {
        console.error('Error updating revenue:', revenueError);
        // Don't fail the whole request if revenue update fails
      }
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
