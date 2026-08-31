const { supabaseAdmin: supabase } = require('../config/supabase.js');

/**
 * Phân loại sự cố bảo trì/sửa chữa tự động qua từ khóa
 */
function categorizeMaintenance(desc = '', notes = '') {
  const text = `${desc || ''} ${notes || ''}`.toLowerCase();
  if (text.includes('điện') || text.includes('đèn') || text.includes('công tắc') || text.includes('ổ cắm') || text.includes('chập') || text.includes('aptomat')) {
    return { id: 'electric', name: 'Hệ thống Điện' };
  }
  if (text.includes('nước') || text.includes('vòi') || text.includes('ống') || text.includes('bồn') || text.includes('rò rỉ') || text.includes('thấm') || text.includes('nghẹt') || text.includes('thoát')) {
    return { id: 'water', name: 'Cấp thoát nước' };
  }
  if (text.includes('cửa') || text.includes('khóa') || text.includes('sơn') || text.includes('tường') || text.includes('gạch') || text.includes('trần') || text.includes('kính') || text.includes('ban công')) {
    return { id: 'infrastructure', name: 'Hạ tầng & Xây dựng' };
  }
  if (text.includes('thang máy') || text.includes('pccc') || text.includes('bơm') || text.includes('máy phát') || text.includes('camera') || text.includes('chuông')) {
    return { id: 'mep', name: 'Thang máy & Cơ điện' };
  }
  return { id: 'other', name: 'Bảo dưỡng & Sửa chữa khác' };
}

/**
 * Lấy toàn bộ danh sách yêu cầu bảo trì đã chuẩn hóa period, chi phí và danh mục
 */
async function getNormalizedMaintenanceRequests() {
  const { data: requests, error } = await supabase
    .from('maintenance_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Error fetching maintenance requests:', error.message);
    return [];
  }

  return (requests || []).map(r => {
    const period = r.period || (r.completed_at ? r.completed_at.slice(0, 7) : (r.created_at ? r.created_at.slice(0, 7) : null));
    const cost = Number(r.actual_cost) > 0 ? Number(r.actual_cost) : (Number(r.estimated_cost) || 0);
    const cat = categorizeMaintenance(r.issue_description, r.notes);

    return {
      ...r,
      normalized_period: period,
      resolved_cost: cost,
      category_id: cat.id,
      category_name: cat.name
    };
  });
}

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
    const floor = p.apartments?.floor ?? 'Không xác định';
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
 * Thống kê tài chính chi tiết theo tầng: Thu (Hóa đơn) vs Chi (Bảo trì)
 */
exports.getFinancialByFloor = async () => {
  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('apt_id, amount');

  if (payError) throw payError;

  const { data: apartments, error: aptError } = await supabase
    .from('apartments')
    .select('apt_id, floor');
  
  if (aptError) throw aptError;

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

  // Lấy chi phí bảo trì theo tầng
  const maintenanceReqs = await getNormalizedMaintenanceRequests();
  const expenseMap = {};
  maintenanceReqs.forEach(r => {
    const floor = floorMap[r.apt_id] ?? 'Khu vực chung';
    expenseMap[floor] = (expenseMap[floor] || 0) + Number(r.resolved_cost || 0);
  });

  const floors = new Set([...Object.keys(paidMap), ...Object.keys(billedMap), ...Object.keys(debtMap), ...Object.keys(expenseMap)]);

  return Array.from(floors)
    .map(key => ({
      floor: isNaN(key) ? null : parseInt(key),
      display: key === 'Khu vực chung' ? 'Khu vực chung' : `Tầng ${key}`,
      total_paid: paidMap[key] || 0,
      total_due_current: billedMap[key] || 0,     
      current_pre_debt: debtMap[key] || 0,
      total_expense: expenseMap[key] || 0,
      net_balance: (paidMap[key] || 0) - (expenseMap[key] || 0),
      collection_rate: billedMap[key] > 0
        ? ((paidMap[key] / billedMap[key]) * 100).toFixed(2) + '%'
        : '0%'
    }))
    .sort((a, b) => (a.floor ?? -1) - (b.floor ?? -1));
};

/**
 * Danh sách các căn hộ đang nợ
 */
exports.getApartmentsInDebt = async (offset = 0, limit = 20) => {
  const { data: bills, error: billsError } = await supabase
    .from('bills')
    .select('apt_id, pre_debt')
    .gt('pre_debt', 0);

  if (billsError) throw billsError;

  const { data: apartments, error: aptError } = await supabase
    .from('apartments')
    .select('apt_id, owner_name, floor');

  if (aptError) throw aptError;

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
 * Chi tiết tài chính một căn hộ cụ thể
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
    .select('period, amount, created_at, payment_method, note')
    .eq('apt_id', apt_id)
    .order('created_at', { ascending: false });

  if (payError) throw payError;

  const totalPaidAllTime = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const currentRemainingDebt = totalDueCurrent - totalPaidAllTime > 0 ? totalDueCurrent - totalPaidAllTime : 0;

  // Lấy lịch sử chi phí sửa chữa căn hộ này
  const maintenanceReqs = await getNormalizedMaintenanceRequests();
  const aptMaintenance = maintenanceReqs.filter(r => r.apt_id === apt_id);
  const totalMaintenanceCost = aptMaintenance.reduce((sum, r) => sum + r.resolved_cost, 0);

  return {
    apt_id,
    new_charges_current: newCharges,          
    pre_debt: preDebt,                         
    total_due_current: totalDueCurrent,        
    total_paid_all_time: totalPaidAllTime,     
    current_remaining_debt: currentRemainingDebt,
    total_maintenance_cost: totalMaintenanceCost,
    maintenance_requests: aptMaintenance,
    payments: payments || []
  };
};

/**
 * Thống kê tài chính tổng quan toàn tòa nhà: Thu (Hóa đơn) - Chi (Bảo trì) = Kết dư
 */
exports.getBuildingFinancialSummary = async () => {
  const { data: allPayments, error: payError } = await supabase
    .from('payments')
    .select('amount');

  if (payError) throw payError;

  const totalIncome = (allPayments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const { data: bills, error: billError } = await supabase
    .from('bills')
    .select('electric, water, service, vehicles, pre_debt, total_due, paid, status');

  if (billError) throw billError;

  let totalDueCurrent = 0;
  let totalPreDebt = 0;
  let apartmentsInDebt = 0;

  (bills || []).forEach(b => {
    const due = Number(b.total_due) || (
      Number(b.electric || 0) + Number(b.water || 0) + Number(b.service || 0) + Number(b.vehicles || 0) + Number(b.pre_debt || 0)
    );
    if (!b.paid && b.status !== 'paid') {
      totalDueCurrent += due;
    }
    totalPreDebt += Number(b.pre_debt || 0);
    if (Number(b.pre_debt || 0) > 0 || (!b.paid && b.status !== 'paid')) {
      apartmentsInDebt++;
    }
  });

  // Tính tổng chi phí bảo trì toàn tòa nhà
  const maintenanceReqs = await getNormalizedMaintenanceRequests();
  const totalExpense = maintenanceReqs.reduce((sum, r) => sum + r.resolved_cost, 0);

  const { count: totalApartments } = await supabase
    .from('apartments')
    .select('*', { count: 'exact', head: true });

  const netBalance = totalIncome - totalExpense;

  return {
    total_income: totalIncome,                 // Tổng thu (Hóa đơn đã thanh toán)
    total_expense: totalExpense,               // Tổng chi (Chi phí bảo trì & sửa chữa)
    net_balance: netBalance,                   // Kết dư quỹ / Lợi nhuận ròng (Thu - Chi)
    total_due_current: totalDueCurrent,        // Tổng công nợ hóa đơn chưa thu
    total_pre_debt: totalPreDebt,              // Nợ cũ kỳ trước
    apartments_in_debt: apartmentsInDebt,
    total_apartments: totalApartments || 0,
    debt_ratio: totalApartments > 0
      ? ((apartmentsInDebt / totalApartments) * 100).toFixed(2) + '%'
      : '0%'
  };
};

/**
 * Thống kê Thu - Chi theo kỳ (tháng): Thu (Hóa đơn) vs Chi (Bảo trì)
 */
exports.getIncomeByPeriod = async (startPeriod, endPeriod) => {
  // Lấy các khoản thanh toán hóa đơn
  const { data: payments, error } = await supabase
    .from('payments')
    .select('period, amount')
    .order('period');

  if (error) throw error;

  const periodMap = {};

  (payments || []).forEach(p => {
    if (!p.period) return;
    const period = p.period.toString().substring(0, 7);
    if (period < startPeriod || period > endPeriod) return;

    if (!periodMap[period]) {
      periodMap[period] = {
        period,
        total_income: 0,
        total_expense: 0,
        net_profit: 0,
        total_charges: 0,
        total_debt: 0,
        payment_count: 0,
        maintenance_count: 0,
        bill_count: 0
      };
    }
    periodMap[period].total_income += Number(p.amount || 0);
    periodMap[period].payment_count += 1;
  });

  // Lấy hóa đơn
  const { data: bills, error: billError } = await supabase
    .from('bills')
    .select('period, electric, water, service, vehicles, pre_debt, total_due, paid, status');

  if (billError) throw billError;

  (bills || []).forEach(b => {
    if (!b.period) return;
    const period = b.period.toString().substring(0, 7);
    if (period < startPeriod || period > endPeriod) return;

    if (!periodMap[period]) {
      periodMap[period] = {
        period,
        total_income: 0,
        total_expense: 0,
        net_profit: 0,
        total_charges: 0,
        total_debt: 0,
        payment_count: 0,
        maintenance_count: 0,
        bill_count: 0
      };
    }

    const charges = Number(b.electric || 0) + Number(b.water || 0) + Number(b.service || 0) + Number(b.vehicles || 0);
    const due = Number(b.total_due) || (charges + Number(b.pre_debt || 0));

    periodMap[period].total_charges += charges;
    if (!b.paid && b.status !== 'paid') {
      periodMap[period].total_debt += due;
    }
    periodMap[period].bill_count += 1;
  });

  // Lấy chi phí bảo trì & sửa chữa (Chi)
  const maintenanceReqs = await getNormalizedMaintenanceRequests();
  maintenanceReqs.forEach(r => {
    if (!r.normalized_period) return;
    const period = r.normalized_period;
    if (period < startPeriod || period > endPeriod) return;

    if (!periodMap[period]) {
      periodMap[period] = {
        period,
        total_income: 0,
        total_expense: 0,
        net_profit: 0,
        total_charges: 0,
        total_debt: 0,
        payment_count: 0,
        maintenance_count: 0,
        bill_count: 0
      };
    }

    periodMap[period].total_expense += Number(r.resolved_cost || 0);
    periodMap[period].maintenance_count += 1;
  });

  // Tính lợi nhuận ròng / kết dư từng tháng
  Object.values(periodMap).forEach(p => {
    p.net_profit = p.total_income - p.total_expense;
  });

  return Object.values(periodMap).sort((a, b) => a.period.localeCompare(b.period));
};

/**
 * Thống kê chi tiết các loại phí trong hóa đơn
 */
exports.getFeeBreakdown = async (period) => {
  let query = supabase
    .from('bills')
    .select('electric, water, service, vehicles, pre_debt, total_due');
  
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
 * Thống kê phân loại Chi phí Bảo trì theo danh mục
 */
exports.getMaintenanceExpensesByCategory = async (period) => {
  const reqs = await getNormalizedMaintenanceRequests();
  
  const filtered = period 
    ? reqs.filter(r => r.normalized_period === period)
    : reqs;

  const catMap = {
    electric: { id: 'electric', name: 'Hệ thống Điện', total: 0, count: 0, items: [] },
    water: { id: 'water', name: 'Cấp thoát nước', total: 0, count: 0, items: [] },
    infrastructure: { id: 'infrastructure', name: 'Hạ tầng & Xây dựng', total: 0, count: 0, items: [] },
    mep: { id: 'mep', name: 'Thang máy & Cơ điện', total: 0, count: 0, items: [] },
    other: { id: 'other', name: 'Bảo dưỡng & Sửa chữa khác', total: 0, count: 0, items: [] }
  };

  filtered.forEach(r => {
    const catId = r.category_id in catMap ? r.category_id : 'other';
    catMap[catId].total += r.resolved_cost;
    catMap[catId].count += 1;
    catMap[catId].items.push({
      id: r.id,
      apt_id: r.apt_id,
      issue_description: r.issue_description,
      cost: r.resolved_cost,
      status: r.status,
      completed_at: r.completed_at || r.created_at
    });
  });

  const totalExpense = Object.values(catMap).reduce((sum, c) => sum + c.total, 0);

  return {
    period: period || 'Tất cả các kỳ',
    total_expense: totalExpense,
    total_requests: filtered.length,
    breakdown: Object.values(catMap).map(c => ({
      id: c.id,
      name: c.name,
      total: c.total,
      count: c.count,
      percentage: totalExpense > 0 ? Number(((c.total / totalExpense) * 100).toFixed(2)) : 0
    })),
    details: catMap
  };
};

/**
 * Lấy danh sách các khoản chi sửa chữa
 */
exports.getMaintenanceExpensesList = async (startPeriod, endPeriod, limit = 50) => {
  const reqs = await getNormalizedMaintenanceRequests();
  let filtered = reqs;

  if (startPeriod && endPeriod) {
    filtered = filtered.filter(r => r.normalized_period >= startPeriod && r.normalized_period <= endPeriod);
  }

  return {
    total: filtered.length,
    total_cost: filtered.reduce((sum, r) => sum + r.resolved_cost, 0),
    data: filtered.slice(0, limit)
  };
};

/**
 * So sánh tài chính giữa các kỳ: Thu, Chi và Lợi nhuận
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
        : '0%',
      expense_change: data2.total_expense - data1.total_expense,
      expense_change_percent: data1.total_expense > 0 
        ? (((data2.total_expense - data1.total_expense) / data1.total_expense) * 100).toFixed(2) + '%'
        : '0%',
      net_profit_change: data2.net_balance - data1.net_balance,
      charges_change: data2.total_charges - data1.total_charges,
      debt_change: data2.total_debt - data1.total_debt
    }
  };
};

/**
 * Tổng hợp dữ liệu một kỳ
 */
exports.getPeriodSummary = async (period) => {
  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('amount, period')
    .eq('period', period);

  if (payError) throw payError;

  const { data: bills, error: billError } = await supabase
    .from('bills')
    .select('electric, water, service, vehicles, pre_debt, total_due, paid, status')
    .eq('period', period);

  if (billError) throw billError;

  const totalIncome = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  
  let totalCharges = 0;
  let totalDebt = 0;

  (bills || []).forEach(b => {
    const charges = Number(b.electric || 0) + Number(b.water || 0) + Number(b.service || 0) + Number(b.vehicles || 0);
    const due = Number(b.total_due) || (charges + Number(b.pre_debt || 0));
    totalCharges += charges;
    if (!b.paid && b.status !== 'paid') {
      totalDebt += due;
    }
  });

  // Chi phí bảo trì trong kỳ
  const maintenanceReqs = await getNormalizedMaintenanceRequests();
  const periodMaintenance = maintenanceReqs.filter(r => r.normalized_period === period);
  const totalExpense = periodMaintenance.reduce((sum, r) => sum + r.resolved_cost, 0);

  const netBalance = totalIncome - totalExpense;

  return {
    period,
    total_income: totalIncome,                 // Thu từ hóa đơn
    total_expense: totalExpense,               // Chi cho sửa chữa/bảo trì
    net_balance: netBalance,                   // Kết dư quỹ
    total_charges: totalCharges,
    total_debt: totalDebt,
    collection_rate: totalCharges > 0 
      ? ((totalIncome / totalCharges) * 100).toFixed(2) + '%'
      : '0%',
    bill_count: bills?.length || 0,
    payment_count: payments?.length || 0,
    maintenance_count: periodMaintenance.length
  };
};

/**
 * Thống kê tỷ lệ thu theo tháng
 */
exports.getCollectionRateByPeriod = async (startPeriod, endPeriod) => {
  const periods = await exports.getIncomeByPeriod(startPeriod, endPeriod);
  
  return periods.map(p => ({
    period: p.period,
    collection_rate: p.total_charges > 0 
      ? Number(((p.total_income / p.total_charges) * 100).toFixed(2))
      : 0,
    total_income: p.total_income,
    total_expense: p.total_expense,
    net_profit: p.net_profit,
    total_charges: p.total_charges || 0
  }));
};

/**
 * Biểu đồ tăng trưởng doanh thu
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
      total_expense: p.total_expense,
      net_profit: p.net_profit,
      growth_rate: Number(growth),
      previous_income: index > 0 ? periods[index - 1].total_income : 0
    };
  });
};

/**
 * Doanh thu theo loại phí
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

    if (Number(b.electric) > 0) {
      feeTypes.electric.total += Number(b.electric);
      feeTypes.electric.apartments.push({ ...apt_info, amount: b.electric });
    }
    if (Number(b.water) > 0) {
      feeTypes.water.total += Number(b.water);
      feeTypes.water.apartments.push({ ...apt_info, amount: b.water });
    }
    if (Number(b.service) > 0) {
      feeTypes.service.total += Number(b.service);
      feeTypes.service.apartments.push({ ...apt_info, amount: b.service });
    }
    if (Number(b.vehicles) > 0) {
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
      percentage: totalRevenue > 0 ? Number(((value.total / totalRevenue) * 100).toFixed(2)) : 0,
      apartment_count: value.apartments.length
    })),
    details: feeTypes
  };
};

/**
 * Phân tích doanh thu theo tầng
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
    const aptNumber = b.apt_id ? b.apt_id.toString() : '';
    const floor = aptNumber.length >= 2 ? aptNumber.substring(0, aptNumber.length - 2) || '0' : '0';
    const groupKey = groupBy === 'floor' ? floor : 'Khu A';
    
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

  const result = Object.values(groupMap).sort((a, b) => b.total_revenue - a.total_revenue);
  const totalRevenue = result.reduce((sum, g) => sum + g.total_revenue, 0);

  return {
    period,
    group_by: groupBy,
    total_revenue: totalRevenue,
    groups: result.map(g => ({
      ...g,
      percentage: totalRevenue > 0 ? Number(((g.total_revenue / totalRevenue) * 100).toFixed(2)) : 0,
      average_per_apartment: g.apartment_count > 0 
        ? Number((g.total_revenue / g.apartment_count).toFixed(0))
        : 0
    }))
  };
};

/**
 * Lọc căn hộ chưa đóng phí
 */
exports.getUnpaidApartments = async (filters = {}) => {
  const { period, floor, min_debt, max_debt, sort_by = 'debt', sort_order = 'desc', offset = 0, limit = 50 } = filters;

  let query = supabase
    .from('bills')
    .select('apt_id, period, electric, water, service, vehicles, pre_debt, total_due, paid, status');

  if (period) {
    query = query.eq('period', period);
  }

  const { data: bills, error } = await query;

  if (error) throw error;

  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('apt_id, period, amount');

  if (payError) throw payError;

  const paidMap = {};
  (payments || []).forEach(p => {
    const key = `${p.apt_id}-${p.period}`;
    paidMap[key] = (paidMap[key] || 0) + Number(p.amount || 0);
  });

  let unpaidList = (bills || [])
    .map(b => {
      const key = `${b.apt_id}-${b.period}`;
      const charges = Number(b.electric || 0) + Number(b.water || 0) + Number(b.service || 0) + Number(b.vehicles || 0);
      const totalBill = Number(b.total_due) || (charges + Number(b.pre_debt || 0));
      const paid = b.paid ? totalBill : (paidMap[key] || 0);
      const unpaid = totalBill - paid;
      
      const aptNumber = b.apt_id ? b.apt_id.toString() : '';
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
        payment_status: b.paid || unpaid <= 0 ? 'Đã thanh toán' : paid > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán'
      };
    })
    .filter(a => a.unpaid_amount > 0);

  if (floor !== undefined) {
    unpaidList = unpaidList.filter(a => a.floor === floor);
  }
  if (min_debt !== undefined) {
    unpaidList = unpaidList.filter(a => a.unpaid_amount >= min_debt);
  }
  if (max_debt !== undefined) {
    unpaidList = unpaidList.filter(a => a.unpaid_amount <= max_debt);
  }

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
 * Tính tổng nợ tồn đọng
 */
exports.getTotalOutstandingDebt = async () => {
  const { data: bills, error: billError } = await supabase
    .from('bills')
    .select('apt_id, period, electric, water, service, vehicles, pre_debt, total_due, paid, status');

  if (billError) throw billError;

  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('apt_id, period, amount');

  if (payError) throw payError;

  const paidMap = {};
  (payments || []).forEach(p => {
    const key = `${p.apt_id}-${p.period}`;
    paidMap[key] = (paidMap[key] || 0) + Number(p.amount || 0);
  });

  let totalOutstanding = 0;
  let totalPreDebt = 0;
  const apartmentsWithDebt = new Set();
  const debtByPeriod = {};

  (bills || []).forEach(b => {
    const key = `${b.apt_id}-${b.period}`;
    const charges = Number(b.electric || 0) + Number(b.water || 0) + Number(b.service || 0) + Number(b.vehicles || 0);
    const totalBill = Number(b.total_due) || (charges + Number(b.pre_debt || 0));
    const paid = b.paid ? totalBill : (paidMap[key] || 0);
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
 * Theo dõi lịch sử trả nợ của căn hộ
 */
exports.getDebtPaymentHistory = async (apt_id) => {
  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('*')
    .eq('apt_id', apt_id)
    .order('created_at', { ascending: false });

  if (payError) throw payError;

  const { data: bills, error: billError } = await supabase
    .from('bills')
    .select('*')
    .eq('apt_id', apt_id)
    .order('period', { ascending: false });

  if (billError) throw billError;

  const history = [];
  let runningDebt = 0;

  const periods = new Set([
    ...(bills || []).map(b => b.period),
    ...(payments || []).map(p => p.period)
  ]);

  Array.from(periods).filter(Boolean).sort((a, b) => a.localeCompare(b)).forEach(period => {
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
    history: history.reverse()
  };
};

/**
 * Báo cáo quyết toán toàn diện Thu (Hóa đơn) - Chi (Bảo trì/Sửa chữa) - Kết dư
 */
exports.getMonthlySettlementReport = async (period) => {
  const summary = await exports.getPeriodSummary(period);
  const feeBreakdown = await exports.getFeeBreakdown(period);
  const expenseBreakdown = await exports.getMaintenanceExpensesByCategory(period);
  const floorData = await exports.getFinancialByFloor();
  
  const { data: bills, error: billError } = await supabase
    .from('bills')
    .select('apt_id, electric, water, service, vehicles, total_due, pre_debt, paid, status')
    .eq('period', period);

  if (billError) throw billError;

  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('apt_id, amount, created_at, payment_method')
    .eq('period', period);

  if (payError) throw payError;

  const apartmentDetails = (bills || []).map(b => {
    const aptPayments = (payments || []).filter(p => p.apt_id === b.apt_id);
    const charges = Number(b.electric || 0) + Number(b.water || 0) + Number(b.service || 0) + Number(b.vehicles || 0);
    const totalBill = Number(b.total_due) || (charges + Number(b.pre_debt || 0));
    const totalPaid = b.paid ? totalBill : aptPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    
    const aptNumber = b.apt_id ? b.apt_id.toString() : '';
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
      status: b.paid || totalPaid >= totalBill ? 'Đã thanh toán' : totalPaid > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán'
    };
  });

  // Lấy chi tiết các đợt sửa chữa trong kỳ này
  const maintenanceReqs = await getNormalizedMaintenanceRequests();
  const periodMaintenance = maintenanceReqs.filter(r => r.normalized_period === period);

  return {
    period,
    generated_at: new Date().toISOString(),
    summary: {
      ...summary,
      fee_breakdown: feeBreakdown,
      expense_breakdown: expenseBreakdown
    },
    by_floor: floorData,
    apartments: apartmentDetails,
    maintenance_items: periodMaintenance.map(m => ({
      id: m.id,
      apt_id: m.apt_id || 'Khu vực chung',
      resident_name: m.resident_name || 'N/A',
      issue_description: m.issue_description,
      category_name: m.category_name,
      cost: m.resolved_cost,
      status: m.status,
      completed_at: m.completed_at || m.created_at
    })),
    statistics: {
      total_apartments: apartmentDetails.length,
      paid_apartments: apartmentDetails.filter(a => a.status === 'Đã thanh toán').length,
      partial_paid: apartmentDetails.filter(a => a.status === 'Thanh toán một phần').length,
      unpaid_apartments: apartmentDetails.filter(a => a.status === 'Chưa thanh toán').length,
      total_outstanding: apartmentDetails.reduce((sum, a) => sum + (a.balance > 0 ? a.balance : 0), 0),
      total_maintenance_count: periodMaintenance.length,
      total_maintenance_cost: summary.total_expense
    }
  };
};