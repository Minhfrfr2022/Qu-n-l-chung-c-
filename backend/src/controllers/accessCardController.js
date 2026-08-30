const { supabase, supabaseAdmin } = require('../config/supabase');

// Lấy tất cả thẻ (admin/manager xem tất cả, cư dân chỉ xem thẻ của mình)
exports.getAllCards = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Admin/Manager có thể xem tất cả thẻ
    if (userRole === 'admin' || userRole === 'manager') {
      const { data, error } = await supabaseAdmin
        .from('access_cards')
        .select(`
          *,
          resident:resident_id(id, username, full_name, apartment_number, email, phone_number),
          issuer:issued_by(id, username, full_name)
        `)
        .order('issued_date', { ascending: false });

      if (error) throw error;
      return res.json(data);
    }

    // Cư dân chỉ xem thẻ của mình
    const { data, error } = await supabaseAdmin
      .from('access_cards')
      .select(`
        *,
        resident:resident_id(id, username, full_name, apartment_number, email, phone_number),
        issuer:issued_by(id, username, full_name)
      `)
      .eq('resident_id', userId)
      .order('issued_date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thẻ:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách thẻ', details: error.message });
  }
};

// Lấy thông tin thẻ theo ID
exports.getCardById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const { data, error } = await supabaseAdmin
      .from('access_cards')
      .select(`
        *,
        resident:resident_id(id, username, full_name, apartment_number, email, phone_number),
        issuer:issued_by(id, username, full_name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Kiểm tra quyền truy cập
    if (userRole !== 'admin' && userRole !== 'manager' && data.resident_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền xem thẻ này' });
    }

    res.json(data);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin thẻ:', error);
    res.status(500).json({ error: 'Không thể lấy thông tin thẻ', details: error.message });
  }
};

// Tạo thẻ mới (chỉ admin/manager)
exports.createCard = async (req, res) => {
  try {
    const { resident_id, card_number, card_type, expiry_date, notes } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Chỉ admin/manager có thể tạo thẻ
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ error: 'Bạn không có quyền tạo thẻ mới' });
    }

    // Kiểm tra các trường bắt buộc
    if (!resident_id || !card_number) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc: resident_id và card_number' });
    }

    // Kiểm tra xem số thẻ đã tồn tại chưa
    const { data: existingCard } = await supabaseAdmin
      .from('access_cards')
      .select('id')
      .eq('card_number', card_number)
      .single();

    if (existingCard) {
      return res.status(400).json({ error: 'Số thẻ này đã tồn tại trong hệ thống' });
    }

    const { data, error } = await supabaseAdmin
      .from('access_cards')
      .insert([
        {
          resident_id,
          card_number,
          card_type: card_type || 'resident',
          status: 'active',
          issued_by: userId,
          expiry_date,
          notes
        }
      ])
      .select(`
        *,
        resident:resident_id(id, username, full_name, apartment_number, email, phone_number),
        issuer:issued_by(id, username, full_name)
      `);

    if (error) throw error;
    res.status(201).json({ message: 'Tạo thẻ mới thành công', data: data[0] });
  } catch (error) {
    console.error('Lỗi khi tạo thẻ:', error);
    res.status(500).json({ error: 'Không thể tạo thẻ mới', details: error.message });
  }
};

// Cập nhật trạng thái thẻ (chỉ admin/manager)
exports.updateCardStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason_for_status } = req.body;
    const userRole = req.user?.role;

    // Chỉ admin/manager có thể cập nhật trạng thái
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ error: 'Bạn không có quyền cập nhật trạng thái thẻ' });
    }

    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['active', 'inactive', 'lost', 'blocked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    const { data, error } = await supabaseAdmin
      .from('access_cards')
      .update({ status, reason_for_status })
      .eq('id', id)
      .select(`
        *,
        resident:resident_id(id, username, full_name, apartment_number, email, phone_number),
        issuer:issued_by(id, username, full_name)
      `);

    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy thẻ' });
    }

    res.json({ message: 'Cập nhật trạng thái thẻ thành công', data: data[0] });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái:', error);
    res.status(500).json({ error: 'Không thể cập nhật trạng thái thẻ', details: error.message });
  }
};

// Báo mất thẻ (cư dân hoặc admin/manager)
exports.reportCardLost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Lấy thông tin thẻ để kiểm tra quyền
    const { data: card, error: fetchError } = await supabaseAdmin
      .from('access_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Chỉ chủ thẻ, admin hoặc manager mới có thể báo mất
    if (userRole !== 'admin' && userRole !== 'manager' && card.resident_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền báo mất thẻ này' });
    }

    const { data, error } = await supabaseAdmin
      .from('access_cards')
      .update({ 
        status: 'lost',
        reason_for_status: 'Thẻ bị mất - được báo cáo bởi cư dân'
      })
      .eq('id', id)
      .select(`
        *,
        resident:resident_id(id, username, full_name, apartment_number, email, phone_number),
        issuer:issued_by(id, username, full_name)
      `);

    if (error) throw error;

    // Tạo phí phạt mất thẻ
    await supabaseAdmin
      .from('card_fees')
      .insert([{
        card_id: id,
        resident_id: card.resident_id,
        fee_type: 'lost',
        amount: 100000, // 100,000 VNĐ
        description: 'Phí phạt mất thẻ cư dân',
        status: 'pending',
        issued_by: userId
      }]);

    res.json({ message: 'Đã báo mất thẻ. Vui lòng liên hệ ban quản lý để được cấp thẻ mới.', data: data[0] });
  } catch (error) {
    console.error('Lỗi khi báo mất thẻ:', error);
    res.status(500).json({ error: 'Không thể báo mất thẻ', details: error.message });
  }
};

// Xóa thẻ (chỉ admin)
exports.deleteCard = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    // Chỉ admin có quyền xóa
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền xóa thẻ' });
    }

    const { error } = await supabaseAdmin
      .from('access_cards')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Xóa thẻ thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa thẻ:', error);
    res.status(500).json({ error: 'Không thể xóa thẻ', details: error.message });
  }
};

// Lấy thẻ theo cư dân (chỉ admin/manager)
exports.getResidentCards = async (req, res) => {
  try {
    const { residentId } = req.params;
    const userRole = req.user?.role;

    // Chỉ admin/manager có thể xem thẻ của cư dân
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ error: 'Bạn không có quyền xem thẻ của cư dân khác' });
    }

    const { data, error } = await supabaseAdmin
      .from('access_cards')
      .select(`
        *,
        issuer:issued_by(id, username, full_name)
      `)
      .eq('resident_id', residentId)
      .order('issued_date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Lỗi khi lấy thẻ của cư dân:', error);
    res.status(500).json({ error: 'Không thể lấy thẻ của cư dân', details: error.message });
  }
};

// Lấy thẻ theo trạng thái (chỉ admin/manager)
exports.getCardsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const userRole = req.user?.role;

    // Chỉ admin/manager có thể xem
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ error: 'Bạn không có quyền xem danh sách này' });
    }

    const validStatuses = ['active', 'inactive', 'lost', 'blocked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    const { data, error } = await supabaseAdmin
      .from('access_cards')
      .select(`
        *,
        resident:resident_id(id, username, full_name, apartment_number, email, phone_number),
        issuer:issued_by(id, username, full_name)
      `)
      .eq('status', status)
      .order('issued_date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Lỗi khi lấy thẻ theo trạng thái:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách thẻ', details: error.message });
  }
};

// ==================== CÁC HÀM MỚI ====================

// Báo hỏng thẻ (cư dân hoặc admin/manager)
exports.reportCardDamaged = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Lấy thông tin thẻ để kiểm tra quyền
    const { data: card, error: fetchError } = await supabaseAdmin
      .from('access_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Chỉ chủ thẻ, admin hoặc manager mới có thể báo hỏng
    if (userRole !== 'admin' && userRole !== 'manager' && card.resident_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền báo hỏng thẻ này' });
    }

    const { data, error } = await supabaseAdmin
      .from('access_cards')
      .update({ 
        status: 'inactive',
        reason_for_status: `Thẻ bị hỏng - ${description || 'không có mô tả'}`
      })
      .eq('id', id)
      .select(`
        *,
        resident:resident_id(id, username, full_name, apartment_number, email, phone_number),
        issuer:issued_by(id, username, full_name)
      `);

    if (error) throw error;

    // Tạo phí thay thẻ
    await supabaseAdmin
      .from('card_fees')
      .insert([{
        card_id: id,
        resident_id: card.resident_id,
        fee_type: 'damaged',
        amount: 50000, // 50,000 VNĐ
        description: `Phí thay thẻ bị hỏng - ${description || 'không có mô tả'}`,
        status: 'pending',
        issued_by: userId
      }]);

    res.json({ message: 'Đã báo hỏng thẻ. Vui lòng liên hệ ban quản lý để được thay thẻ mới.', data: data[0] });
  } catch (error) {
    console.error('Lỗi khi báo hỏng thẻ:', error);
    res.status(500).json({ error: 'Không thể báo hỏng thẻ', details: error.message });
  }
};

// Gia hạn thẻ (chỉ admin/manager)
exports.renewCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { expiry_date, notes } = req.body;
    const userRole = req.user?.role;

    // Chỉ admin/manager có thể gia hạn thẻ
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ error: 'Bạn không có quyền gia hạn thẻ' });
    }

    if (!expiry_date) {
      return res.status(400).json({ error: 'Vui lòng cung cấp ngày hết hạn mới' });
    }

    const { data, error } = await supabaseAdmin
      .from('access_cards')
      .update({ 
        expiry_date,
        status: 'active',
        notes: notes || 'Thẻ đã được gia hạn',
        reason_for_status: null
      })
      .eq('id', id)
      .select(`
        *,
        resident:resident_id(id, username, full_name, apartment_number, email, phone_number),
        issuer:issued_by(id, username, full_name)
      `);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy thẻ' });
    }

    res.json({ message: 'Gia hạn thẻ thành công', data: data[0] });
  } catch (error) {
    console.error('Lỗi khi gia hạn thẻ:', error);
    res.status(500).json({ error: 'Không thể gia hạn thẻ', details: error.message });
  }
};

// Lấy lịch sử quét thẻ
exports.getCardAccessLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { limit = 50, offset = 0 } = req.query;

    // Lấy thông tin thẻ để kiểm tra quyền
    const { data: card } = await supabaseAdmin
      .from('access_cards')
      .select('resident_id')
      .eq('id', id)
      .single();

    // Kiểm tra quyền truy cập
    if (userRole !== 'admin' && userRole !== 'manager' && card?.resident_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền xem lịch sử thẻ này' });
    }

    const { data, error, count } = await supabaseAdmin
      .from('card_access_logs')
      .select('*', { count: 'exact' })
      .eq('card_id', id)
      .order('access_time', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({
      data,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử quét thẻ:', error);
    res.status(500).json({ error: 'Không thể lấy lịch sử quét thẻ', details: error.message });
  }
};

// Lấy lịch sử thay đổi thẻ
exports.getCardHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Lấy thông tin thẻ để kiểm tra quyền
    const { data: card } = await supabaseAdmin
      .from('access_cards')
      .select('resident_id')
      .eq('id', id)
      .single();

    // Kiểm tra quyền truy cập
    if (userRole !== 'admin' && userRole !== 'manager' && card?.resident_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền xem lịch sử thẻ này' });
    }

    const { data, error } = await supabaseAdmin
      .from('card_history')
      .select(`
        *,
        action_user:action_by(id, username, full_name)
      `)
      .eq('card_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử thay đổi:', error);
    res.status(500).json({ error: 'Không thể lấy lịch sử thay đổi', details: error.message });
  }
};

// Lấy các khoản phí liên quan đến thẻ
exports.getCardFees = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Lấy thông tin thẻ để kiểm tra quyền
    const { data: card } = await supabaseAdmin
      .from('access_cards')
      .select('resident_id')
      .eq('id', id)
      .single();

    // Kiểm tra quyền truy cập
    if (userRole !== 'admin' && userRole !== 'manager' && card?.resident_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền xem phí của thẻ này' });
    }

    const { data, error } = await supabaseAdmin
      .from('card_fees')
      .select(`
        *,
        issuer:issued_by(id, username, full_name)
      `)
      .eq('card_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phí:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách phí', details: error.message });
  }
};

// Thống kê thẻ (chỉ admin/manager)
exports.getCardStatistics = async (req, res) => {
  try {
    const userRole = req.user?.role;

    // Chỉ admin/manager có thể xem thống kê
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ error: 'Bạn không có quyền xem thống kê' });
    }

    // Đếm số lượng thẻ theo trạng thái
    const { data: statusCounts } = await supabaseAdmin
      .from('access_cards')
      .select('status');

    const statistics = {
      total: statusCounts?.length || 0,
      active: statusCounts?.filter(c => c.status === 'active').length || 0,
      inactive: statusCounts?.filter(c => c.status === 'inactive').length || 0,
      lost: statusCounts?.filter(c => c.status === 'lost').length || 0,
      blocked: statusCounts?.filter(c => c.status === 'blocked').length || 0
    };

    // Đếm số lượng thẻ theo loại
    const { data: typeCounts } = await supabaseAdmin
      .from('access_cards')
      .select('card_type');

    statistics.by_type = {
      resident: typeCounts?.filter(c => c.card_type === 'resident').length || 0,
      guest: typeCounts?.filter(c => c.card_type === 'guest').length || 0,
      staff: typeCounts?.filter(c => c.card_type === 'staff').length || 0
    };

    // Thống kê phí
    const { data: fees } = await supabaseAdmin
      .from('card_fees')
      .select('amount, status');

    statistics.fees = {
      total_pending: fees?.filter(f => f.status === 'pending').reduce((sum, f) => sum + parseFloat(f.amount), 0) || 0,
      total_paid: fees?.filter(f => f.status === 'paid').reduce((sum, f) => sum + parseFloat(f.amount), 0) || 0,
      count_pending: fees?.filter(f => f.status === 'pending').length || 0,
      count_paid: fees?.filter(f => f.status === 'paid').length || 0
    };

    res.json(statistics);
  } catch (error) {
    console.error('Lỗi khi lấy thống kê:', error);
    res.status(500).json({ error: 'Không thể lấy thống kê', details: error.message });
  }
};

// Ghi log quét thẻ (được gọi bởi hệ thống thiết bị)
exports.logCardAccess = async (req, res) => {
  try {
    const { card_id, access_point, access_type, access_status, device_id, notes } = req.body;
    
    if (!card_id || !access_point || !access_type || !access_status) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    // Lấy thông tin thẻ
    const { data: card, error: cardError } = await supabaseAdmin
      .from('access_cards')
      .select('resident_id, status')
      .eq('id', card_id)
      .single();

    if (cardError || !card) {
      return res.status(404).json({ error: 'Không tìm thấy thẻ' });
    }

    // Ghi log
    const { data, error } = await supabaseAdmin
      .from('card_access_logs')
      .insert([{
        card_id,
        resident_id: card.resident_id,
        access_point,
        access_type,
        access_status,
        device_id,
        notes
      }])
      .select();

    if (error) throw error;

    res.status(201).json({ message: 'Đã ghi log truy cập', data: data[0] });
  } catch (error) {
    console.error('Lỗi khi ghi log truy cập:', error);
    res.status(500).json({ error: 'Không thể ghi log truy cập', details: error.message });
  }
};
