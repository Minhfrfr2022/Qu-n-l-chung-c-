const { supabaseAdmin: supabase } = require('../config/supabase.js');

/**
 * Thống kê tổng đã thu của từng căn hộ (phân trang, sắp xếp giảm dần theo tiền thu)
 */
exports.getIncomeByApartmentPaginated = async (offset = 0, limit = 20) => {
  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('apt_id, amount');

  if (payError) throw payError;

  const incomeMap = (payments || []).reduce((acc, p) => {
    acc[p.apt_id] = (acc[p.apt_id] || 0) + Number(p.amount);
    return acc;
  }, {});

  const { data: apartments, error: aptError, count } = await supabase
    .from('apartments')
    .select('apt_id, owner_name, floor', { count: 'exact' })
    .order('apt_id')
    .range(offset, offset + limit - 1);

  if (aptError) throw aptError;

  const resultData = (apartments || [])
    .map(apt => ({
      apt_id: apt.apt_id,
      owner_name: apt.owner_name,
      floor: apt.floor,
      total_paid: incomeMap[apt.apt_id] || 0
    }))
    .sort((a, b) => b.total_paid - a.total_paid);

  return { data: resultData, total: count || 0 };
};

/**
 * Thống kê tổng đã thu theo tầng
 */
exports.getIncomeByFloor = async () => {
  const { data: payments, error } = await supabase
    .from('payments')
    .select('apartments!inner(floor), amount');

  if (error) throw error;

  if (!payments || payments.length === 0) return [];

  const floorMap = payments.reduce((acc, p) => {
    const floor = p.apartments.floor ?? 'Không xác định';
    acc[floor] = (acc[floor] || 0) + Number(p.amount || 0);
    return acc;
  }, {});

  return Object.entries(floorMap)
    .map(([key, value]) => ({
      floor: isNaN(key) ? null : parseInt(key),
      display: `Tầng ${key}`,
      total_income: value
    }))
    .sort((a, b) => (a.floor ?? -1) - (b.floor ?? -1));
};

/**
 * Thống kê tài chính chi tiết theo tầng (dựa trên hóa đơn hiện tại trong bảng bills)
 */
exports.getFinancialByFloor = async () => {
  // Get all payments
  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('apt_id, amount');

  if (payError) throw payError;

  // Get all apartments for floor mapping
  const { data: apartments, error: aptError } = await supabase
    .from('apartments')
    .select('apt_id, floor');
  
  if (aptError) throw aptError;

  // Create apt_id -> floor mapping
  const floorMap = (apartments || []).reduce((acc, apt) => {
    acc[apt.apt_id] = apt.floor ?? 'Không xác định';
    return acc;
  }, {});

  const paidMap = (payments || []).reduce((acc, p) => {
    const floor = floorMap[p.apt_id] ?? 'Không xác định';
    acc[floor] = (acc[floor] || 0) + Number(p.amount || 0);
    return acc;
  }, {});

  const { data: bills, error: billError } = await supabase
    .from('bills')
    .select('apt_id, electric, water, service, vehicles, pre_debt');

  if (billError) throw billError;

  const billedMap = {}; 
  const debtMap = {};  

  (bills || []).forEach(b => {
    const floor = floorMap[b.apt_id] ?? 'Không xác định';
    const currentNew = Number(b.electric || 0) + Number(b.water || 0) + Number(b.service || 0) + Number(b.vehicles || 0);
    const totalDue = currentNew + Number(b.pre_debt || 0);

    billedMap[floor] = (billedMap[floor] || 0) + totalDue;
    debtMap[floor] = (debtMap[floor] || 0) + Number(b.pre_debt || 0);
  });

  const floors = new Set([...Object.keys(paidMap), ...Object.keys(billedMap), ...Object.keys(debtMap)]);

  return Array.from(floors)
    .map(key => ({
      floor: isNaN(key) ? null : parseInt(key),
      display: `Tầng ${key}`,
      total_paid: paidMap[key] || 0,
      total_due_current: billedMap[key] || 0,     
      current_pre_debt: debtMap[key] || 0,        
      collection_rate: billedMap[key] > 0
        ? ((paidMap[key] / billedMap[key]) * 100).toFixed(2) + '%'
        : '0%'
    }))
    .sort((a, b) => (a.floor ?? -1) - (b.floor ?? -1));
};

/**
 * Danh sách các căn hộ đang nợ (pre_debt > 0 trong bảng bills hiện tại)
 */
exports.getApartmentsInDebt = async (offset = 0, limit = 20) => {
  // Get bills with debt
  const { data: bills, error: billsError } = await supabase
    .from('bills')
    .select('apt_id, pre_debt')
    .gt('pre_debt', 0);

  if (billsError) throw billsError;

  // Get apartments info separately
  const { data: apartments, error: aptError } = await supabase
    .from('apartments')
    .select('apt_id, owner_name, floor');

  if (aptError) throw aptError;

  // Create mapping
  const aptMap = (apartments || []).reduce((acc, apt) => {
    acc[apt.apt_id] = apt;
    return acc;
  }, {});

  const debtList = (bills || [])
    .map(b => ({
      apt_id: b.apt_id,
      owner_name: aptMap[b.apt_id]?.owner_name || 'N/A',
      floor: aptMap[b.apt_id]?.floor || 0,
      debt: Number(b.pre_debt)
    }))
    .sort((a, b) => b.debt - a.debt);

  return {
    data: debtList.slice(offset, offset + limit),
    total: debtList.length
  };
};

/**
 * Chi tiết tài chính một căn hộ cụ thể (dựa trên hóa đơn hiện tại + lịch sử thanh toán)
 */
exports.getApartmentFinancialSummary = async (apt_id) => {
  const { data: bill, error: billError } = await supabase
    .from('bills')
    .select('electric, water, service, vehicles, pre_debt')
    .eq('apt_id', apt_id)
    .single();

  if (billError && billError.code !== 'PGRST116') throw billError; 

  const newCharges = bill
    ? Number(bill.electric || 0) + Number(bill.water || 0) + Number(bill.service || 0) + Number(bill.vehicles || 0)
    : 0;

  const preDebt = Number(bill?.pre_debt || 0);
  const totalDueCurrent = newCharges + preDebt;

  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('period, amount, paid_at, method, note')
    .eq('apt_id', apt_id)
    .order('paid_at', { ascending: false });

  if (payError) throw payError;

  const totalPaidAllTime = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const currentRemainingDebt = totalDueCurrent - totalPaidAllTime > 0 ? totalDueCurrent - totalPaidAllTime : 0;

  return {
    apt_id,
    new_charges_current: newCharges,          
    pre_debt: preDebt,                         
    total_due_current: totalDueCurrent,        
    total_paid_all_time: totalPaidAllTime,     
    current_remaining_debt: currentRemainingDebt,
    payments: payments || []
  };
};

/**
 * Thống kê tài chính tổng quan toàn tòa nhà
 */
exports.getBuildingFinancialSummary = async () => {
  const { data: allPayments, error: payError } = await supabase
    .from('payments')
    .select('amount');

  if (payError) throw payError;

  const totalIncome = (allPayments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const { data: bills, error: billError } = await supabase
    .from('bills')
    .select('electric, water, service, vehicles, pre_debt');

  if (billError) throw billError;

  let totalDueCurrent = 0;
  let totalPreDebt = 0;
  let apartmentsInDebt = 0;

  (bills || []).forEach(b => {
    const newCharges = Number(b.electric || 0) + Number(b.water || 0) + Number(b.service || 0) + Number(b.vehicles || 0);
    const due = newCharges + Number(b.pre_debt || 0);
    totalDueCurrent += due;
    totalPreDebt += Number(b.pre_debt || 0);
    if (Number(b.pre_debt || 0) > 0) apartmentsInDebt++;
  });

  const { count: totalApartments } = await supabase
    .from('apartments')
    .select('*', { count: 'exact', head: true });

  return {
    total_income: totalIncome,
    total_due_current: totalDueCurrent,         
    total_pre_debt: totalPreDebt,               
    apartments_in_debt: apartmentsInDebt,
    total_apartments: totalApartments || 0,
    debt_ratio: totalApartments > 0
      ? ((apartmentsInDebt / totalApartments) * 100).toFixed(2) + '%'
      : '0%'
  };
};

/**
 * Thống kê thu chi theo thời gian (tháng)
 * Trả về dữ liệu cho chart
 */
exports.getIncomeByPeriod = async (startPeriod, endPeriod) => {
  // Fetch all payments without period filter  
  const { data: payments, error } = await supabase
    .from('payments')
    .select('period, amount')
    .order('period');

  if (error) throw error;

  // Filter by period range manually
  const filteredPayments = (payments || []).filter(p => {
    if (!p.period) return false;
    const period = p.period.toString();
    return period >= startPeriod && period <= endPeriod;
  });

  // Group by period
  const periodMap = {};
  filteredPayments.forEach(p => {
    // Convert YYYY-MM-DD to YYYY-MM for display
    const periodDate = p.period.toString();
    const period = periodDate.substring(0, 7); // Get YYYY-MM
    
    if (!periodMap[period]) {
      periodMap[period] = {
        period,
        total_income: 0,
        payment_count: 0
      };
    }
    periodMap[period].total_income += Number(p.amount || 0);
    periodMap[period].payment_count += 1;
  });

  // Get bills for the same periods
  const { data: bills, error: billError } = await supabase
    .from('bills')
    .select('period, electric, water, service, vehicles, pre_debt');

  if (billError) throw billError;

  // Filter bills by period range
  const filteredBills = (bills || []).filter(b => {
    if (!b.period) return false;
    const period = b.period.toString();
    return period >= startPeriod && period <= endPeriod;
  });

  // Group bills by period
  filteredBills.forEach(b => {
    const period = b.period;
    if (!periodMap[period]) {
      periodMap[period] = {
        period,
        total_income: 0,
        payment_count: 0
      };
    }
    
    const charges = Number(b.electric || 0) + Number(b.water || 0) + 
                   Number(b.service || 0) + Number(b.vehicles || 0);
    
    if (!periodMap[period].total_charges) {
      periodMap[period].total_charges = 0;
      periodMap[period].total_debt = 0;
      periodMap[period].bill_count = 0;
    }
    
    periodMap[period].total_charges += charges;
    periodMap[period].total_debt += Number(b.pre_debt || 0);
    periodMap[period].bill_count += 1;
  });

  return Object.values(periodMap).sort((a, b) => a.period.localeCompare(b.period));
};

/**
 * Thống kê chi tiết các loại phí
 */
exports.getFeeBreakdown = async (period) => {
  let query = supabaseAdmin
    .from('bills')
    .select('electric, water, service, vehicles, total, pre_debt');
  
  if (period) {
    query = query.eq('period', period);
  }

  const { data: bills, error } = await query;

  if (error) throw error;

  const breakdown = {
    electric: 0,
    water: 0,
    service: 0,
    vehicles: 0,
    total: 0
  };

  (bills || []).forEach(b => {
    breakdown.electric += Number(b.electric || 0);
    breakdown.water += Number(b.water || 0);
    breakdown.service += Number(b.service || 0);
    breakdown.vehicles += Number(b.vehicles || 0);
  });

  breakdown.total = breakdown.electric + breakdown.water + breakdown.service + breakdown.vehicles;

  return breakdown;
};

/**
 * So sánh thu chi giữa các kỳ
 */
exports.comparePeriodsFinancial = async (period1, period2) => {
  const [data1, data2] = await Promise.all([
    exports.getPeriodSummary(period1),
    exports.getPeriodSummary(period2)
  ]);

  return {
    period1: data1,
    period2: data2,
    comparison: {
      income_change: data2.total_income - data1.total_income,
      income_change_percent: data1.total_income > 0 
        ? (((data2.total_income - data1.total_income) / data1.total_income) * 100).toFixed(2) + '%'
        : 'N/A',
      charges_change: data2.total_charges - data1.total_charges,
      debt_change: data2.total_debt - data1.total_debt
    }
  };
};

/**
 * Tổng hợp dữ liệu một kỳ
 * @param {string} period - Format YYYY-MM
 */
exports.getPeriodSummary = async (period) => {
  // Both bills and payments use period as TEXT (YYYY-MM format)
  // Query payments directly using the period string
  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('amount, period')
    .eq('period', period);

  if (payError) {
    console.error('Error fetching payments:', payError);
    throw payError;
  }

  const { data: bills, error: billError } = await supabase
    .from('bills')
    .select('electric, water, service, vehicles, pre_debt, total')
    .eq('period', period);

  if (billError) throw billError;

  const totalIncome = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  
  let totalCharges = 0;
  let totalDebt = 0;

  (bills || []).forEach(b => {
    // Calculate new charges as total - pre_debt (since total = new charges + pre_debt)
    const newCharges = Number(b.total || 0) - Number(b.pre_debt || 0);
    totalCharges += newCharges;
    totalDebt += Number(b.pre_debt || 0);
  });

  return {
    period, // Return the input period format (YYYY-MM)
    total_income: totalIncome,
    total_charges: totalCharges,
    total_debt: totalDebt,
    collection_rate: totalCharges > 0 
      ? ((totalIncome / totalCharges) * 100).toFixed(2) + '%'
      : '0%',
    bill_count: bills?.length || 0,
    payment_count: payments?.length || 0
  };
};

/**
 * Thống kê tỷ lệ thu theo tháng (cho chart)
 */
exports.getCollectionRateByPeriod = async (startPeriod, endPeriod) => {
  const periods = await exports.getIncomeByPeriod(startPeriod, endPeriod);
  
  return periods.map(p => ({
    period: p.period,
    collection_rate: p.total_charges > 0 
      ? ((p.total_income / p.total_charges) * 100).toFixed(2)
      : 0,
    total_income: p.total_income,
    total_charges: p.total_charges || 0
  }));
};

/**
 * 3.1.1 Biểu đồ tăng trưởng doanh thu
 * Tính tốc độ tăng trưởng theo tháng
 */
exports.getRevenueGrowth = async (startPeriod, endPeriod) => {
  const periods = await exports.getIncomeByPeriod(startPeriod, endPeriod);
  
  return periods.map((p, index) => {
    const growth = index > 0 
      ? periods[index - 1].total_income > 0
        ? (((p.total_income - periods[index - 1].total_income) / periods[index - 1].total_income) * 100).toFixed(2)
        : 0
      : 0;
    
    return {
      period: p.period,
      total_income: p.total_income,
      growth_rate: growth,
      previous_income: index > 0 ? periods[index - 1].total_income : 0
    };
  });
};

/**
 * 3.1.2 Doanh thu theo loại phí (chi tiết từng loại)
 */
exports.getRevenueByFeeType = async (period) => {
  let query = supabase
    .from('bills')
    .select('apt_id, electric, water, service, vehicles');
  
  if (period) {
    query = query.eq('period', period);
  }

  const { data: bills, error } = await query;

  if (error) throw error;

  const feeTypes = {
    electric: { name: 'Tiền điện', total: 0, apartments: [] },
    water: { name: 'Tiền nước', total: 0, apartments: [] },
    service: { name: 'Phí dịch vụ', total: 0, apartments: [] },
    vehicles: { name: 'Phí xe', total: 0, apartments: [] }
  };

  (bills || []).forEach(b => {
    const apt_info = {
      apt_id: b.apt_id,
      owner_name: 'N/A',
      floor: 'N/A'
    };

    if (b.electric > 0) {
      feeTypes.electric.total += Number(b.electric);
      feeTypes.electric.apartments.push({ ...apt_info, amount: b.electric });
    }
    if (b.water > 0) {
      feeTypes.water.total += Number(b.water);
      feeTypes.water.apartments.push({ ...apt_info, amount: b.water });
    }
    if (b.service > 0) {
      feeTypes.service.total += Number(b.service);
      feeTypes.service.apartments.push({ ...apt_info, amount: b.service });
    }
    if (b.vehicles > 0) {
      feeTypes.vehicles.total += Number(b.vehicles);
      feeTypes.vehicles.apartments.push({ ...apt_info, amount: b.vehicles });
    }
  });

  const totalRevenue = Object.values(feeTypes).reduce((sum, type) => sum + type.total, 0);

  return {
    period,
    total_revenue: totalRevenue,
    breakdown: Object.entries(feeTypes).map(([key, value]) => ({
      type: key,
      name: value.name,
      total: value.total,
      percentage: totalRevenue > 0 ? ((value.total / totalRevenue) * 100).toFixed(2) : 0,
      apartment_count: value.apartments.length
    })),
    details: feeTypes
  };
};

/**
 * 3.1.3 Phân tích doanh thu theo tầng/khu
 */
exports.getRevenueByFloorOrArea = async (period, groupBy = 'floor') => {
  let query = supabase
    .from('bills')
    .select('apt_id, electric, water, service, vehicles');
  
  if (period) {
    query = query.eq('period', period);
  }

  const { data: bills, error } = await query;

  if (error) throw error;

  const groupMap = {};

  (bills || []).forEach(b => {
    // Extract floor from apt_id (e.g., "501" -> floor 5)
    const aptNumber = b.apt_id.toString();
    const floor = aptNumber.length >= 2 ? aptNumber.substring(0, aptNumber.length - 2) || '0' : '0';
    const groupKey = groupBy === 'floor' 
      ? floor
      : 'Khu A';
    
    if (!groupMap[groupKey]) {
      groupMap[groupKey] = {
        group: groupKey,
        total_revenue: 0,
        electric: 0,
        water: 0,
        service: 0,
        vehicles: 0,
        apartment_count: 0,
        apartments: []
      };
    }

    const totalApt = Number(b.electric || 0) + Number(b.water || 0) + 
                     Number(b.service || 0) + Number(b.vehicles || 0);

    groupMap[groupKey].total_revenue += totalApt;
    groupMap[groupKey].electric += Number(b.electric || 0);
    groupMap[groupKey].water += Number(b.water || 0);
    groupMap[groupKey].service += Number(b.service || 0);
    groupMap[groupKey].vehicles += Number(b.vehicles || 0);
    groupMap[groupKey].apartment_count += 1;
    groupMap[groupKey].apartments.push({
      apt_id: b.apt_id,
      owner_name: 'N/A',
      total: totalApt
    });
  });

  const result = Object.values(groupMap)
    .sort((a, b) => b.total_revenue - a.total_revenue);

  const totalRevenue = result.reduce((sum, g) => sum + g.total_revenue, 0);

  return {
    period,
    group_by: groupBy,
    total_revenue: totalRevenue,
    groups: result.map(g => ({
      ...g,
      percentage: totalRevenue > 0 ? ((g.total_revenue / totalRevenue) * 100).toFixed(2) : 0,
      average_per_apartment: g.apartment_count > 0 
        ? (g.total_revenue / g.apartment_count).toFixed(0)
        : 0
    }))
  };
};

/**
 * 3.2.1 Lọc căn hộ chưa đóng phí (có thể lọc theo kỳ, tầng, mức nợ)
 */
exports.getUnpaidApartments = async (filters = {}) => {
  const { period, floor, min_debt, max_debt, sort_by = 'debt', sort_order = 'desc', offset = 0, limit = 50 } = filters;

  let query = supabase
    .from('bills')
    .select('apt_id, period, electric, water, service, vehicles, pre_debt, total');

  if (period) {
    query = query.eq('period', period);
  }

  const { data: bills, error } = await query;

  if (error) throw error;

  // Get all payments
  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('apt_id, period, amount');

  if (payError) throw payError;

  // Calculate paid amount for each apartment-period
  const paidMap = {};
  (payments || []).forEach(p => {
    const key = `${p.apt_id}-${p.period}`;
    paidMap[key] = (paidMap[key] || 0) + Number(p.amount || 0);
  });

  // Filter unpaid apartments
  let unpaidList = (bills || [])
    .map(b => {
      const key = `${b.apt_id}-${b.period}`;
      const totalBill = Number(b.total || 0);
      const paid = paidMap[key] || 0;
      const unpaid = totalBill - paid;
      
      // Extract floor from apt_id
      const aptNumber = b.apt_id.toString();
      const aptFloor = aptNumber.length >= 2 ? parseInt(aptNumber.substring(0, aptNumber.length - 2)) || 0 : 0;

      return {
        apt_id: b.apt_id,
        period: b.period,
        owner_name: 'N/A',
        floor: aptFloor,
        area: 'N/A',
        phone: 'N/A',
        total_bill: totalBill,
        paid_amount: paid,
        unpaid_amount: unpaid > 0 ? unpaid : 0,
        pre_debt: Number(b.pre_debt || 0),
        electric: Number(b.electric || 0),
        water: Number(b.water || 0),
        service: Number(b.service || 0),
        vehicles: Number(b.vehicles || 0),
        payment_status: unpaid <= 0 ? 'Đã thanh toán' : unpaid < totalBill ? 'Thanh toán một phần' : 'Chưa thanh toán'
      };
    })
    .filter(a => a.unpaid_amount > 0); // Only unpaid apartments

  // Apply floor filter if specified
  if (floor !== undefined) {
    unpaidList = unpaidList.filter(a => a.floor === floor);
  }

  // Apply debt range filters
  if (min_debt !== undefined) {
    unpaidList = unpaidList.filter(a => a.unpaid_amount >= min_debt);
  }

  if (max_debt !== undefined) {
    unpaidList = unpaidList.filter(a => a.unpaid_amount <= max_debt);
  }

  // Sort
  unpaidList.sort((a, b) => {
    const aValue = sort_by === 'debt' ? a.unpaid_amount : a[sort_by];
    const bValue = sort_by === 'debt' ? b.unpaid_amount : b[sort_by];
    return sort_order === 'desc' ? bValue - aValue : aValue - bValue;
  });

  const total = unpaidList.length;
  const paginatedData = unpaidList.slice(offset, offset + limit);

  return {
    data: paginatedData,
    total,
    summary: {
      total_unpaid_apartments: total,
      total_unpaid_amount: unpaidList.reduce((sum, a) => sum + a.unpaid_amount, 0),
      total_pre_debt: unpaidList.reduce((sum, a) => sum + a.pre_debt, 0)
    }
  };
};

/**
 * 3.2.2 Tính tổng nợ dư kiện (tổng hợp toàn bộ)
 */
exports.getTotalOutstandingDebt = async () => {
  const { data: bills, error: billError } = await supabase
    .from('bills')
    .select('apt_id, period, electric, water, service, vehicles, pre_debt, total');

  if (billError) throw billError;

  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('apt_id, period, amount');

  if (payError) throw payError;

  // Calculate paid amount for each apartment-period
  const paidMap = {};
  (payments || []).forEach(p => {
    const key = `${p.apt_id}-${p.period}`;
    paidMap[key] = (paidMap[key] || 0) + Number(p.amount || 0);
  });

  let totalOutstanding = 0;
  let totalPreDebt = 0;
  let apartmentsWithDebt = new Set();
  const debtByPeriod = {};

  (bills || []).forEach(b => {
    const key = `${b.apt_id}-${b.period}`;
    const totalBill = Number(b.total || 0);
    const paid = paidMap[key] || 0;
    const unpaid = totalBill - paid;

    if (unpaid > 0) {
      totalOutstanding += unpaid;
      apartmentsWithDebt.add(b.apt_id);

      if (!debtByPeriod[b.period]) {
        debtByPeriod[b.period] = {
          period: b.period,
          total_debt: 0,
          apartment_count: 0
        };
      }
      debtByPeriod[b.period].total_debt += unpaid;
      debtByPeriod[b.period].apartment_count += 1;
    }

    totalPreDebt += Number(b.pre_debt || 0);
  });

  return {
    total_outstanding_debt: totalOutstanding,
    total_pre_debt: totalPreDebt,
    apartments_with_debt: apartmentsWithDebt.size,
    debt_by_period: Object.values(debtByPeriod).sort((a, b) => b.period.localeCompare(a.period))
  };
};

/**
 * 3.2.3 Theo dõi lịch sử trả nợ của một căn hộ
 */
exports.getDebtPaymentHistory = async (apt_id) => {
  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('*')
    .eq('apt_id', apt_id)
    .order('paid_at', { ascending: false });

  if (payError) throw payError;

  const { data: bills, error: billError } = await supabase
    .from('bills')
    .select('*')
    .eq('apt_id', apt_id)
    .order('period', { ascending: false });

  if (billError) throw billError;

  // Calculate payment history with running debt balance
  const history = [];
  let runningDebt = 0;

  // Combine bills and payments by period
  const periods = new Set([
    ...(bills || []).map(b => b.period),
    ...(payments || []).map(p => p.period)
  ]);

  Array.from(periods).sort((a, b) => a.localeCompare(b)).forEach(period => {
    const periodBills = (bills || []).filter(b => b.period === period);
    const periodPayments = (payments || []).filter(p => p.period === period);

    const totalBilled = periodBills.reduce((sum, b) => 
      sum + Number(b.electric || 0) + Number(b.water || 0) + 
      Number(b.service || 0) + Number(b.vehicles || 0), 0
    );

    const totalPaid = periodPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const preDebt = periodBills[0]?.pre_debt || 0;

    runningDebt += totalBilled - totalPaid;

    history.push({
      period,
      billed: totalBilled,
      pre_debt: Number(preDebt),
      paid: totalPaid,
      balance: runningDebt,
      payment_count: periodPayments.length,
      payments: periodPayments,
      status: totalPaid >= totalBilled ? 'Đã thanh toán đủ' : totalPaid > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán'
    });
  });

  return {
    apt_id,
    current_debt: runningDebt > 0 ? runningDebt : 0,
    history: history.reverse() // Most recent first
  };
};

/**
 * 3.3.1 Tổng hợp thu chi tháng (báo cáo quyết toán)
 */
exports.getMonthlySettlementReport = async (period) => {
  console.log('[Settlement] Starting report for period:', period);
  
  console.log('[Settlement] Fetching period summary...');
  const summary = await exports.getPeriodSummary(period);
  console.log('[Settlement] Period summary OK');
  
  console.log('[Settlement] Fetching fee breakdown...');
  const feeBreakdown = await exports.getFeeBreakdown(period);
  console.log('[Settlement] Fee breakdown OK');
  
  console.log('[Settlement] Fetching floor data...');
  const floorData = await exports.getFinancialByFloor();
  console.log('[Settlement] Floor data OK');
  
  const { data: bills, error: billError } = await supabase
    .from('bills')
    .select('apt_id, electric, water, service, vehicles, total, pre_debt')
    .eq('period', period);

  if (billError) throw billError;

  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('apt_id, amount, paid_at, method')
    .eq('period', period);

  if (payError) throw payError;

  // Calculate apartment-level details
  const apartmentDetails = (bills || []).map(b => {
    const aptPayments = (payments || []).filter(p => p.apt_id === b.apt_id);
    const totalPaid = aptPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalBill = Number(b.total || 0);
    
    // Extract floor from apt_id
    const aptNumber = b.apt_id.toString();
    const floor = aptNumber.length >= 2 ? parseInt(aptNumber.substring(0, aptNumber.length - 2)) || 0 : 0;

    return {
      apt_id: b.apt_id,
      owner_name: 'N/A',
      floor: floor,
      phone: 'N/A',
      electric: Number(b.electric || 0),
      water: Number(b.water || 0),
      service: Number(b.service || 0),
      vehicles: Number(b.vehicles || 0),
      pre_debt: Number(b.pre_debt || 0),
      total_bill: totalBill,
      total_paid: totalPaid,
      balance: totalBill - totalPaid,
      status: totalPaid >= totalBill ? 'Đã thanh toán' : totalPaid > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán'
    };
  });

  return {
    period,
    generated_at: new Date().toISOString(),
    summary: {
      ...summary,
      fee_breakdown: feeBreakdown
    },
    by_floor: floorData.filter(f => {
      // Only include floors with data in this period
      return apartmentDetails.some(a => a.floor === f.floor);
    }),
    apartments: apartmentDetails,
    statistics: {
      total_apartments: apartmentDetails.length,
      paid_apartments: apartmentDetails.filter(a => a.status === 'Đã thanh toán').length,
      partial_paid: apartmentDetails.filter(a => a.status === 'Thanh toán một phần').length,
      unpaid_apartments: apartmentDetails.filter(a => a.status === 'Chưa thanh toán').length,
      total_outstanding: apartmentDetails.reduce((sum, a) => sum + (a.balance > 0 ? a.balance : 0), 0)
    }
  };
};