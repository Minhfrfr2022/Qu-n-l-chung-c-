const { supabase, supabaseAdmin } = require('../config/supabase');

// Helper function to create notifications
const createNotification = async (userId, type, title, message, link = null, metadata = null) => {
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      link,
      metadata,
      read: false,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw error - notifications shouldn't break main functionality
  }
};

// Get all visitors (admin/manager) or own visitors (resident)
exports.getAllVisitors = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Admin/Manager có thể xem tất cả khách
    if (userRole === 'admin' || userRole === 'manager') {
      const { data, error } = await supabaseAdmin
        .from('visitors')
        .select(`
          *,
          resident:resident_id(id, username, full_name, apartment_number, email),
          approver:approved_by(id, username, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json(data);
    }

    // Cư dân chỉ xem khách của mình
    const { data, error } = await supabaseAdmin
      .from('visitors')
      .select(`
        *,
        resident:resident_id(id, username, full_name, apartment_number, email),
        approver:approved_by(id, username, full_name)
      `)
      .eq('resident_id', userId)
      .order('created_at', { ascending: false});

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách khách', details: error.message });
  }
};

// Get visitor by ID
exports.getVisitorById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const { data, error } = await supabaseAdmin
      .from('visitors')
      .select(`
        *,
        resident:resident_id(id, username, full_name, apartment_number, email),
        approver:approved_by(id, username, full_name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Check permissions
    if (userRole !== 'admin' && userRole !== 'manager' && data.resident_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching visitor:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create new visitor request (Residents only)
exports.createVisitor = async (req, res) => {
  try {
    const { visitor_name, visitor_phone, visitor_email, purpose, expected_arrival, expected_departure, notes } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Validate required fields
    if (!visitor_name || !purpose || !expected_arrival) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc: tên khách, mục đích, thời gian đến dự kiến' });
    }

    const { data, error } = await supabaseAdmin
      .from('visitors')
      .insert([
        {
          resident_id: userId,
          visitor_name,
          visitor_phone,
          visitor_email,
          purpose,
          expected_arrival,
          expected_departure,
          notes,
          status: 'pending'
        }
      ])
      .select(`
        *,
        resident:resident_id(id, username, full_name, apartment_number, email)
      `);

    if (error) throw error;
    
    // Create notification for managers/admins about new visitor request
    const managerData = await supabaseAdmin
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'manager']);
    
    if (managerData.data) {
      for (const manager of managerData.data) {
        await createNotification(
          manager.id,
          'info',
          'Yêu cầu đăng ký khách mới',
          `${data[0]?.resident?.full_name || 'Cư dân'} (${data[0]?.resident?.apartment_number}) đã yêu cầu đăng ký khách: ${visitor_name}`,
          '/admin/visitors',
          { visitor_id: data[0]?.id, apartment: data[0]?.resident?.apartment_number }
        );
      }
    }
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating visitor:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update visitor status (admin/manager only)
exports.updateVisitorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Only admin/manager can update status
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {
      status,
      notes
    };

    // If approving or rejecting, set approved_by and approved_at
    if (status === 'approved' || status === 'rejected') {
      updateData.approved_by = userId;
      updateData.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('visitors')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        resident:resident_id(id, username, full_name, apartment_number, email),
        approver:approved_by(id, username, full_name)
      `);

    if (error) throw error;
    
    // Create notification for resident about visitor status update
    if (data[0]?.resident_id && (status === 'approved' || status === 'rejected')) {
      const statusMessage = status === 'approved' 
        ? `Yêu cầu đăng ký khách ${data[0]?.visitor_name} của bạn đã được phê duyệt.`
        : `Yêu cầu đăng ký khách ${data[0]?.visitor_name} của bạn đã bị từ chối.`;
      
      const notificationType = status === 'approved' ? 'success' : 'warning';
      
      await createNotification(
        data[0].resident_id,
        notificationType,
        status === 'approved' ? 'Khách được phê duyệt' : 'Khách bị từ chối',
        statusMessage,
        '/my-visitors',
        { visitor_id: id, status }
      );
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating visitor:', error);
    res.status(500).json({ error: error.message });
  }
};

// Cancel visitor request
exports.cancelVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Get visitor to check permissions
    const { data: visitor, error: fetchError } = await supabaseAdmin
      .from('visitors')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Only resident, admin, or manager can cancel
    if (userRole !== 'admin' && userRole !== 'manager' && visitor.resident_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data, error } = await supabaseAdmin
      .from('visitors')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select(`
        *,
        resident:resident_id(id, username, full_name, apartment_number, email),
        approver:approved_by(id, username, full_name)
      `);

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Error cancelling visitor:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete visitor record (admin only)
exports.deleteVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    // Only admin can delete
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admin can delete visitor records' });
    }

    const { error } = await supabaseAdmin
      .from('visitors')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting visitor:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get pending visitor requests (for admin dashboard)
exports.getPendingVisitors = async (req, res) => {
  try {
    const userRole = req.user?.role;

    // Only admin/manager can view pending requests
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data, error } = await supabaseAdmin
      .from('visitors')
      .select(`
        *,
        resident:resident_id(id, username, full_name, apartment_number, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching pending visitors:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get approved visitors (for security guard to check at entrance)
exports.getApprovedVisitors = async (req, res) => {
  try {
    const { date } = req.query; // Optional: filter by date (YYYY-MM-DD)
    
    let query = supabaseAdmin
      .from('visitors')
      .select(`
        *,
        resident:resident_id(id, username, full_name, apartment_number, email),
        approver:approved_by(id, username, full_name)
      `)
      .eq('status', 'approved')
      .order('expected_arrival', { ascending: true });

    // Filter by date if provided
    if (date) {
      const startDate = new Date(date).toISOString().split('T')[0];
      const endDate = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      query = query
        .gte('expected_arrival', `${startDate}T00:00:00`)
        .lt('expected_arrival', `${endDate}T00:00:00`);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching approved visitors:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark visitor as checked in (security guard confirms arrival)
exports.checkInVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current visitor
    const { data: visitor, error: fetchError } = await supabaseAdmin
      .from('visitors')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Check if status is approved
    if (visitor.status !== 'approved') {
      return res.status(400).json({ error: 'Visitor not approved' });
    }

    // Mark as completed
    const { data, error } = await supabaseAdmin
      .from('visitors')
      .update({ status: 'completed' })
      .eq('id', id)
      .select(`
        *,
        resident:resident_id(id, username, full_name, apartment_number, email),
        approver:approved_by(id, username, full_name)
      `);

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Error checking in visitor:', error);
    res.status(500).json({ error: error.message });
  }
};
