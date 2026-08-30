const paymentService = require('../repositories/paymentService');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/helper');
const { supabaseAdmin } = require('../config/supabase');
// Lập hóa đơn tháng
exports.createBill = async (req, res) => {
  try {
    const data = await paymentService.createMonthlyBill(req.body);

    // Create notifications for apartment owner about new bill
    if (data?.apt_id) {
      const ownerId = await getApartmentOwnerUserId(data.apt_id);
      if (ownerId) {
        await createNotification(
          ownerId,
          'warning',
          'Hóa đơn mới',
          `Hóa đơn tháng ${data.period || 'này'} của căn hộ ${data.apt_id} đã được tạo`,
          '/payments',
          { apt_id: data.apt_id, period: data.period, total: data.total }
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Lập hóa đơn thành công',
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Thống kê tổng đã thu của từng căn hộ (phân trang + sắp xếp giảm dần)
exports.getIncomeByApartment = async (req, res) => {
  try {
    const { page, page_size, offset, limit } = getPaginationParams(req.query);

    const { data, total } = await paymentService.getIncomeByApartmentPaginated(offset, limit);

    const result = buildPaginatedResponse(data, total, page, page_size);

    res.status(200).json({
      success: true,
      message: 'Thống kê tổng tiền đã thu theo từng căn hộ',
      result,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Thống kê đã thu theo tầng
exports.getIncomeByFloor = async (req, res) => {
  try {
    const data = await paymentService.getIncomeByFloor();

    res.status(200).json({
      success: true,
      message: 'Thống kê tổng tiền đã thu theo tầng',
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Thống kê tài chính chi tiết theo tầng
exports.getFinancialByFloor = async (req, res) => {
  try {
    const data = await paymentService.getFinancialByFloor();

    res.status(200).json({
      success: true,
      message: 'Thống kê tài chính chi tiết theo tầng (dựa trên hóa đơn hiện tại)',
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Danh sách căn hộ đang nợ (pre_debt > 0)
exports.getApartmentsInDebt = async (req, res) => {
  try {
    const { page, page_size, offset, limit } = getPaginationParams(req.query);

    const { data, total } = await paymentService.getApartmentsInDebt(offset, limit);

    const result = buildPaginatedResponse(data, total, page, page_size);

    res.status(200).json({
      success: true,
      message: 'Danh sách các căn hộ đang có nợ (dựa trên pre_debt hiện tại)',
      result,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Chi tiết tài chính một căn hộ cụ thể
exports.getApartmentFinancialSummary = async (req, res) => {
  try {
    const { apt_id } = req.params;

    const data = await paymentService.getApartmentFinancialSummary(apt_id);

    res.status(200).json({
      success: true,
      message: `Thống kê tài chính chi tiết căn hộ ${apt_id}`,
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Tổng quan tài chính toàn tòa nhà
exports.getBuildingFinancialSummary = async (req, res) => {
  try {
    const data = await paymentService.getBuildingFinancialSummary();

    res.status(200).json({
      success: true,
      message: 'Thống kê tài chính tổng quan toàn tòa nhà',
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Thống kê thu chi theo khoảng thời gian
exports.getIncomeByPeriod = async (req, res) => {
  try {
    const { start_period, end_period } = req.query;
    
    if (!start_period || !end_period) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu tham số start_period hoặc end_period (format: YYYY-MM)' 
      });
    }

    const data = await paymentService.getIncomeByPeriod(start_period, end_period);

    res.status(200).json({
      success: true,
      message: 'Thống kê thu chi theo thời gian',
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Thống kê chi tiết các loại phí
exports.getFeeBreakdown = async (req, res) => {
  try {
    const { period } = req.query;
    const data = await paymentService.getFeeBreakdown(period);

    res.status(200).json({
      success: true,
      message: period 
        ? `Phân tích các loại phí trong kỳ ${period}` 
        : 'Phân tích tổng hợp các loại phí',
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// So sánh thu chi giữa 2 kỳ
exports.comparePeriodsFinancial = async (req, res) => {
  try {
    const { period1, period2 } = req.query;
    
    if (!period1 || !period2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu tham số period1 hoặc period2 (format: YYYY-MM)' 
      });
    }

    const data = await paymentService.comparePeriodsFinancial(period1, period2);

    res.status(200).json({
      success: true,
      message: `So sánh tài chính giữa kỳ ${period1} và ${period2}`,
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Tỷ lệ thu theo thời gian
exports.getCollectionRateByPeriod = async (req, res) => {
  try {
    const { start_period, end_period } = req.query;
    
    if (!start_period || !end_period) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu tham số start_period hoặc end_period (format: YYYY-MM)' 
      });
    }

    const data = await paymentService.getCollectionRateByPeriod(start_period, end_period);

    res.status(200).json({
      success: true,
      message: 'Tỷ lệ thu theo thời gian',
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Tổng hợp một kỳ cụ thể
exports.getPeriodSummary = async (req, res) => {
  try {
    const { period } = req.params;
    
    if (!period) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu tham số period (format: YYYY-MM)' 
      });
    }

    const data = await paymentService.getPeriodSummary(period);

    res.status(200).json({
      success: true,
      message: `Tổng hợp tài chính kỳ ${period}`,
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==== MODULE 3.1: QUẢN LÝ DOANH THU ====

// 3.1.1 Biểu đồ tăng trưởng doanh thu
exports.getRevenueGrowth = async (req, res) => {
  try {
    const { start_period, end_period } = req.query;
    
    if (!start_period || !end_period) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu tham số start_period hoặc end_period (format: YYYY-MM)' 
      });
    }

    const data = await paymentService.getRevenueGrowth(start_period, end_period);

    res.status(200).json({
      success: true,
      message: 'Biểu đồ tăng trưởng doanh thu',
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 3.1.2 Doanh thu theo loại phí
exports.getRevenueByFeeType = async (req, res) => {
  try {
    const { period } = req.query;
    const data = await paymentService.getRevenueByFeeType(period);

    res.status(200).json({
      success: true,
      message: period 
        ? `Doanh thu theo loại phí trong kỳ ${period}` 
        : 'Doanh thu theo loại phí (tổng hợp)',
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 3.1.3 Phân tích theo tầng/khu
exports.getRevenueByFloorOrArea = async (req, res) => {
  try {
    const { period, group_by = 'floor' } = req.query;
    const data = await paymentService.getRevenueByFloorOrArea(period, group_by);

    res.status(200).json({
      success: true,
      message: `Phân tích doanh thu theo ${group_by === 'floor' ? 'tầng' : 'khu'}`,
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==== MODULE 3.2: KIỂM SOÁT NỢ ĐỌNG ====

// 3.2.1 Lọc căn hộ chưa đóng phí
exports.getUnpaidApartments = async (req, res) => {
  try {
    const filters = {
      period: req.query.period,
      floor: req.query.floor ? parseInt(req.query.floor) : undefined,
      min_debt: req.query.min_debt ? parseFloat(req.query.min_debt) : undefined,
      max_debt: req.query.max_debt ? parseFloat(req.query.max_debt) : undefined,
      sort_by: req.query.sort_by || 'debt',
      sort_order: req.query.sort_order || 'desc',
      offset: req.query.offset ? parseInt(req.query.offset) : 0,
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };

    const result = await paymentService.getUnpaidApartments(filters);

    res.status(200).json({
      success: true,
      message: 'Danh sách căn hộ chưa đóng phí',
      ...result,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 3.2.2 Tính tổng nợ dư kiện
exports.getTotalOutstandingDebt = async (req, res) => {
  try {
    const data = await paymentService.getTotalOutstandingDebt();

    res.status(200).json({
      success: true,
      message: 'Tổng hợp nợ dư kiện',
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 3.2.3 Theo dõi lịch sử trả nợ
exports.getDebtPaymentHistory = async (req, res) => {
  try {
    const { apt_id } = req.params;
    
    if (!apt_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu tham số apt_id' 
      });
    }

    const data = await paymentService.getDebtPaymentHistory(apt_id);

    res.status(200).json({
      success: true,
      message: `Lịch sử trả nợ của căn hộ ${apt_id}`,
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==== MODULE 3.3: BÁO CÁO QUYẾT TOÁN ====

// 3.3.1 Tổng hợp thu chi tháng (báo cáo quyết toán)
exports.getMonthlySettlementReport = async (req, res) => {
  try {
    const { period } = req.params;
    
    if (!period) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu tham số period (format: YYYY-MM)' 
      });
    }

    const data = await paymentService.getMonthlySettlementReport(period);

    res.status(200).json({
      success: true,
      message: `Báo cáo quyết toán tháng ${period}`,
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Helper function to create notifications (moved from billController)
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
  }
};

// Helper function to get apartment owner's user ID
const getApartmentOwnerUserId = async (apt_id) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('apartments')
      .select('owner_id')
      .eq('id', apt_id)
      .single();

    if (error) throw error;
    return data?.owner_id;
  } catch (error) {
    console.error('Error fetching apartment owner:', error);
    return null;
  }
};