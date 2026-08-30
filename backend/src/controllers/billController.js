const { error } = require("console");
const{BillRepository} = require("../repositories/billRepository")
const {PAGE_SIZE} = require("../utils/constants");
const { supabaseAdmin } = require("../config/supabase");

const { sendPushToUser, sendPushToAll, PRIORITY, CATEGORY } = require('../services/fcmService');

// Helper function to create notifications (DB Inbox + FCM Push)
const createNotification = async (userId, type, title, message, link = null, metadata = null) => {
  try {
    await sendPushToUser(userId, {
      type,
      title,
      message,
      link,
      metadata,
      category: CATEGORY.BILLS,
      priority: PRIORITY.IMPORTANT,
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
      .eq('apt_id', apt_id)
      .single();

    if (error) throw error;
    return data?.owner_id;
  } catch (error) {
    console.error('Error fetching apartment owner:', error);
    return null;
  }
};

// Helper function to notify all clients with privacy-safe broadcast
const notifyAllClients = async (type, title, message, link = null, metadata = null) => {
  try {
    await sendPushToAll({
      type,
      title,
      message,
      link,
      metadata,
      category: CATEGORY.BILLS,
      priority: PRIORITY.IMPORTANT,
    });
  } catch (error) {
    console.error('Error notifying all clients:', error);
  }
};

// Helper function to ensure an apartment exists in DB, or auto-create it if missing
const ensureApartmentExists = async (aptId) => {
  if (!aptId) return null;
  const cleanAptId = String(aptId).trim().toUpperCase();
  try {
    // 1. Check if apartment exists (bypassing RLS with supabaseAdmin)
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('apartments')
      .select('*')
      .eq('apt_id', cleanAptId)
      .maybeSingle();

    if (existing) return existing;

    // 2. Auto-create apartment if not found
    const { data: created, error: insertErr } = await supabaseAdmin
      .from('apartments')
      .insert([{
        apt_id: cleanAptId,
        owner_name: 'Chưa cập nhật',
        status: 'occupied',
        resident_count: 0
      }])
      .select()
      .single();

    if (insertErr) {
      console.warn('Auto-create apartment insert failed, checking existing again:', insertErr.message);
      const { data: fallback } = await supabaseAdmin
        .from('apartments')
        .select('*')
        .eq('apt_id', cleanAptId)
        .maybeSingle();
      return fallback || null;
    }

    return created;
  } catch (err) {
    console.error('ensureApartmentExists error:', err);
    return null;
  }
};

class BillController {
    repo;
    constructor() {
        this.repo = new BillRepository()
    }

    async insert_new_bill(req, res) {
        try {
            const {
                apt_id,
                owner
            } = req.body;
            if(!apt_id || !owner) {
                throw new Error("No apt_id or owner found!");
            }
            const {data, error} = await this.repo.insert(req.body);
            if(error) {
                throw new Error(error.message);
            }
            
            // Create notification for apartment owner
            const ownerId = await getApartmentOwnerUserId(apt_id);
            if (ownerId) {
              await createNotification(
                ownerId,
                'warning',
                'Hóa đơn mới',
                `Hóa đơn mới cho căn hộ ${apt_id} đã được tạo. Vui lòng thanh toán kịp thời.`,
                '/payments',
                { apt_id, bill_amount: data?.total }
              );
            }
            
            return res.status(200).json({message: "Success!", new_bill: data});
        }
        catch(error) {
            return res.status(500).json({message: error.message});
        }
    }

    async update_exist_bill(req, res) {
        try {
            const {apt_id, bill} = req.body;
            if(!apt_id) {
                throw new Error("No apt_id found");
            }
            const {data, error} = await this.repo.update(bill, apt_id);
            if(error) {
                throw new Error(error.message);
            }
            
            // Create notification for apartment owner about bill update
            const ownerId = await getApartmentOwnerUserId(apt_id);
            if (ownerId) {
              await createNotification(
                ownerId,
                'info',
                'Hóa đơn được cập nhật',
                `Hóa đơn của căn hộ ${apt_id} đã được cập nhật. Vui lòng kiểm tra lại.`,
                '/payments',
                { apt_id }
              );
            }
            
            return res.status(200).json({message: "Success!", new_bill: data})
        }
        catch(error) {
            return res.status(500).json({message: error.message});
        }
    }

    async query_a_bill(req, res) {
        try {
            const {apt_id} = req.query;
            const {data, error} = await this.repo.query(apt_id);
            console.log(data);
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({message: "Success!", data: data});
        }
        catch (error) {
            return res.status(500).json({message: error.message});
        }
    }

    async query_all_bills(req, res) {
        try {
            let result = {}
            const {
                page_number,
            } = req.query;
            console.log(page_number)
            if(!page_number) {
                throw new Error("No page number found!");
            }
            const start = (page_number - 1) * PAGE_SIZE;
            const end = start + PAGE_SIZE - 1;

            const { data, error } = await this.repo.query_with_range(start, end);

            if(error) {
                throw new Error(error.message);
            }

            result.data = data;
            result.current_page = page_number;
            result.page_size = PAGE_SIZE;
            const {count, error: countError} = await this.repo.count_all_docs();
            if(countError) {
                console.warn("Unable to retrieve total document: ", countError.message);
            }
            result.total_docs = count || 0;
            result.total_pages = Math.ceil(result.total_docs / PAGE_SIZE);

            return res.status(200).json({message: "Success", result: result});
        }
        catch(error) {
            return res.status(400).json({message: error.message});
        }
    } 


    async query_by_owner(req, res) {
        try {
            let result = {}
            const {
                page_number,
                page_size,
                owner
            } = req.query;
            console.log(page_number)
            if(!page_number || !page_size || !owner ) {
                throw new Error("No page number found!");
            }
            const start = (page_number - 1) * page_size;
            const end = start + page_size - 1;

            const { data, error } = await this.repo.query_by_owner(owner, start, end);

            if(error) {
                throw new Error(error.message);
            }

            result.data = data;
            result.current_page = page_number;
            result.page_size = page_size;
            const {count, error: countError} = await this.repo.count_all_bills_by_owner(owner);
            if(countError) {
                console.warn("Unable to retrieve total document: ", countError.message);
            }
            result.total_docs = count || 0;
            result.total_pages = Math.ceil(result.total_docs / page_size);

            return res.status(200).json({message: "Success", result: result});
        }
        catch(error) {
            return res.status(400).json({message: error.message});
        }
    }

    async query_with_filter(req, res) {
        try {
            let result = {}
            const {
                page_number,
                page_size,
                filter
            } = req.query;
            console.log(filter)
            console.log(page_number)
            if(!page_number || !page_size) {
                throw new Error("No page number found!");
            }
            const start = (page_number - 1) * page_size;
            const end = start + page_size - 1;

            // `filter` may arrive as a JSON string from the client; parse if necessary
            let parsedFilter = filter;
            if (typeof filter === 'string' && filter) {
                try {
                    parsedFilter = JSON.parse(filter);
                } catch (e) {
                    // if parsing fails, keep original string
                    parsedFilter = filter;
                }
            }

            const { data, error } = await this.repo.query_with_filter(parsedFilter, start, end);

            if(error) {
                throw new Error(error.message);
            }

            result.data = data;
            result.current_page = page_number;
            result.page_size = page_size;
            const {count, error: countError} = await this.repo.count_all_with_filter(parsedFilter);
            if(countError) {
                console.warn("Unable to retrieve total document: ", countError.message);
            }
            result.total_docs = count || 0;
            result.total_pages = Math.ceil(result.total_docs / page_size);

            return res.status(200).json({message: "Success", result: result});
        }
        catch(error) {
            return res.status(400).json({message: error.message});
        }
    }

    async reset(req, res) {
        try {
            const {
                apt_id,
            } = req.body;
            if(!apt_id) {
                throw new Error("No apt_id found!");
            }
            // Mark bill as paid ("Đã thu") and record a payment for the period if none exists
            // Determine period for the bill: prefer period in body, otherwise use most recent bill
            const period = req.body.period || null;
            let billPeriod = period;
            if (!billPeriod) {
                const { data: existingBills, error: fetchErr } = await this.repo.query(apt_id);
                if (!fetchErr && existingBills && existingBills.length > 0) {
                    billPeriod = existingBills[0].period || null;
                }
            }

            // Find the bill record to compute amount
            const { data: billsData, error: billErr } = await this.repo.query(apt_id);
            if (billErr) throw billErr;
            const targetBill = (Array.isArray(billsData) ? billsData.find(b => (billPeriod ? b.period === billPeriod : true)) : null) || (Array.isArray(billsData) && billsData[0]) || null;
            const amount = targetBill ? (Number(targetBill.total || 0) || (Number(targetBill.electric || 0) + Number(targetBill.water || 0) + Number(targetBill.service || 0) + Number(targetBill.vehicles || 0) + Number(targetBill.pre_debt || 0))) : 0;

            // Check if a payment already exists for apt_id+period to avoid duplicates
            let paymentsExist = false;
            try {
                const pm = await this.repo.findPayments(apt_id, billPeriod);
                if (pm && pm.data && pm.data.length > 0) paymentsExist = true;
            } catch (e) {
                console.warn('Failed to check existing payments', e);
            }

            if (!paymentsExist && amount > 0) {
                // record payment
                const payload = { apt_id, amount };
                if (billPeriod) payload.period = billPeriod;
                const { data: payData, error: payErr } = await this.repo.accrue_fee(apt_id, payload);
                if (payErr) console.warn('Failed to record payment during reset', payErr.message || payErr);
            }

            // mark bill as paid
            const updateObj = { paid: true, paid_at: new Date().toISOString() };
            if (billPeriod) updateObj.period = billPeriod;
            const {data, error} = await this.repo.update(updateObj, { apt_id, period: billPeriod });
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({message: "ok", data: data});
        } 
        catch(error) {
            return res.status(500).json({message: error.message});
        }
    }

    async query_sum_all(req, res) {
        try {
            const {data, error} = await this.repo.query_all_collected();
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({message: "Success!", data: data});
        }
        catch(error) {
            return res.status(400).json({message: error.message});
        }
    }

    // Enhanced bill management methods
    async getBillAnalytics(req, res) {
        try {
            const { data, error } = await this.repo.getBillAnalytics();
            if (error) throw new Error(error.message);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getPaymentStats(req, res) {
        try {
            const { period } = req.query;
            const { data, error } = await this.repo.getPaymentStats(period);
            if (error) throw new Error(error.message);
            return res.status(200).json({ success: true, data: data?.[0] || {} });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getApartmentBillHistory(req, res) {
        try {
            const { apt_id } = req.params;
            if (!apt_id) throw new Error('Apartment ID is required');
            const { data, error } = await this.repo.getApartmentBillHistory(apt_id);
            if (error) throw new Error(error.message);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async markBillAsPaid(req, res) {
        try {
            const { apt_id, period, payment_method } = req.body;
            if (!apt_id || !period) throw new Error('Apartment ID and period are required');
            
            const { data, error } = await this.repo.markBillAsPaid(apt_id, period, payment_method);
            if (error) throw new Error(error.message);

            // Create notification for apartment owner
            const ownerId = await getApartmentOwnerUserId(apt_id);
            if (ownerId) {
                await createNotification(
                    ownerId,
                    'success',
                    'Thanh toán thành công',
                    `Hóa đơn kỳ ${period} của căn hộ ${apt_id} đã được thanh toán thành công.`,
                    '/bills',
                    { apt_id, period, payment_method }
                );
            }

            return res.status(200).json({ success: true, message: 'Bill marked as paid', data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async addLateFee(req, res) {
        try {
            const { apt_id, period, late_fee } = req.body;
            if (!apt_id || !period || late_fee === undefined) {
                throw new Error('Apartment ID, period, and late fee are required');
            }

            const { data, error } = await this.repo.addLateFee(apt_id, period, late_fee);
            if (error) throw new Error(error.message);

            // Notify owner about late fee
            const ownerId = await getApartmentOwnerUserId(apt_id);
            if (ownerId) {
                await createNotification(
                    ownerId,
                    'warning',
                    'Phí trễ hạn',
                    `Phí trễ hạn ${late_fee.toLocaleString('vi-VN')} VNĐ đã được áp dụng cho hóa đơn kỳ ${period}.`,
                    '/bills',
                    { apt_id, period, late_fee }
                );
            }

            return res.status(200).json({ success: true, message: 'Late fee added', data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async applyDiscount(req, res) {
        try {
            const { apt_id, period, discount } = req.body;
            if (!apt_id || !period || discount === undefined) {
                throw new Error('Apartment ID, period, and discount are required');
            }

            const { data, error } = await this.repo.applyDiscount(apt_id, period, discount);
            if (error) throw new Error(error.message);

            // Notify owner about discount
            const ownerId = await getApartmentOwnerUserId(apt_id);
            if (ownerId) {
                await createNotification(
                    ownerId,
                    'success',
                    'Giảm giá',
                    `Giảm giá ${discount.toLocaleString('vi-VN')} VNĐ đã được áp dụng cho hóa đơn kỳ ${period}.`,
                    '/bills',
                    { apt_id, period, discount }
                );
            }

            return res.status(200).json({ success: true, message: 'Discount applied', data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getOverdueBills(req, res) {
        try {
            const { data, error } = await this.repo.getOverdueBills();
            if (error) throw new Error(error.message);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async sendReminder(req, res) {
        try {
            const { apt_id, period } = req.body;
            if (!apt_id || !period) throw new Error('Apartment ID and period are required');

            const { data, error } = await this.repo.sendReminder(apt_id, period);
            if (error) throw new Error(error.message);

            // Send notification reminder
            const ownerId = await getApartmentOwnerUserId(apt_id);
            if (ownerId) {
                await createNotification(
                    ownerId,
                    'warning',
                    'Nhắc nhở thanh toán',
                    `Đây là lời nhắc về hóa đơn kỳ ${period} chưa được thanh toán. Vui lòng thanh toán sớm để tránh phí trễ hạn.`,
                    '/bills',
                    { apt_id, period }
                );
            }

            return res.status(200).json({ success: true, message: 'Reminder sent', data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateBillStatus(req, res) {
        try {
            const { apt_id, period, status } = req.body;
            if (!apt_id || !period || !status) {
                throw new Error('Apartment ID, period, and status are required');
            }

            const validStatuses = ['unpaid', 'partial', 'paid', 'overdue'];
            if (!validStatuses.includes(status)) {
                throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
            }

            const { data, error } = await this.repo.updateBillStatus(apt_id, period, status);
            if (error) throw new Error(error.message);

            return res.status(200).json({ success: true, message: 'Bill status updated', data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async query_sum_all_OLD(req, res) {
        try {
            const {data, error} = await this.repo.query_all_collected();
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({result: data});
        }
        catch(error) {
            return res.status(500).json({message: error.message})
        }
    }

    // Return aggregated totals for a period
    async summary(req, res) {
        try {
            const { period } = req.query;
            if (!period) {
                return res.status(400).json({ message: 'Missing period parameter' });
            }

            // Use a DB-side aggregate function to compute accurate totals across all rows for the period
            const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('get_period_summary', { p_period: period });
            if (rpcErr) throw rpcErr;
            // rpc returns an array with one row
            const row = Array.isArray(rpcData) && rpcData.length > 0 ? rpcData[0] : null;
            if (!row) {
                return res.status(200).json({ period, total_due: 0, total_received: 0, total_bills: 0, paid_count: 0, unpaid_count: 0 });
            }
            return res.status(200).json(row);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async collect_bill(req, res) {
        try {
            const {
                apt_id,
                                total,
                                period
            } = req.body;
            if(!apt_id) {
                throw new Error("No apt found");
            }
                        // determine period: prefer provided period, otherwise use bill's period
                        let billPeriod = period || null;
                        if (!billPeriod) {
                            const { data: existingBills, error: fetchErr } = await this.repo.query(apt_id);
                            if (!fetchErr && existingBills && existingBills.length > 0) {
                                billPeriod = existingBills[0].period || null;
                            }
                        }

                        const paymentPayload = { apt_id, amount: total };
                        if (billPeriod) paymentPayload.period = billPeriod;

                        const { data, error } = await this.repo.accrue_fee(apt_id, paymentPayload);
            if(error) {
                throw new Error(error.message);
            }
                        // mark the bill as paid (for that period)
                        const updateObj = { paid: true, paid_at: new Date().toISOString() };
                        if (billPeriod) updateObj.period = billPeriod;
                        await this.repo.update(updateObj, apt_id);

                        // Create success notification for apartment owner
                        const ownerId = await getApartmentOwnerUserId(apt_id);
                        if (ownerId) {
                            await createNotification(
                                ownerId,
                                'success',
                                'Thanh toán hóa đơn thành công',
                                `Hóa đơn của căn hộ ${apt_id} đã được thanh toán thành công. Số tiền: ${total?.toLocaleString('vi-VN')}đ`,
                                '/payments',
                                { apt_id, amount: total, period: billPeriod }
                            );
                        }

                        return res.status(200).json({message: "OK", data: data});
        }
        catch(error) {
            return res.status(500).json({message: error.message});
        }
    }

    async setupBills(req, res) {
        try {
            // Now used as service price configuration: period is optional, services must include name, unit_cost and unit
            const { period, services } = req.body;
            const userId = req.user?.id; // Assuming auth middleware sets user info

            // Validate input
            if (!services || !Array.isArray(services) || services.length === 0) {
                throw new Error("Services array is required and cannot be empty");
            }

            // Validate each service - for price configuration we require name, unit_cost and unit. number_of_units is optional.
            services.forEach((service, index) => {
                if (!service.name || service.unit_cost === undefined || !service.unit) {
                    throw new Error(`Service ${index}: name, unit_cost, and unit are required`);
                }
                if (isNaN(service.unit_cost) || service.unit_cost < 0) {
                    throw new Error(`Service ${index}: unit_cost must be a non-negative number`);
                }
                if (service.number_of_units !== undefined && (isNaN(service.number_of_units) || service.number_of_units < 0)) {
                    throw new Error(`Service ${index}: number_of_units must be a non-negative number if provided`);
                }
            });

            // Create bill configuration
            const { data, error } = await supabaseAdmin
                .from('bill_configurations')
                .insert({
                    period,
                    services,
                    status: 'draft',
                    created_by: userId,
                })
                .select()
                .single();

            if (error) {
                throw new Error(error.message);
            }

            return res.status(200).json({
                message: "Bill configuration created successfully",
                data: data
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async publishBillConfiguration(req, res) {
        try {
            const { configId } = req.body;

            if (!configId) {
                throw new Error("Configuration ID is required");
            }

            // Get the configuration
            const { data: config, error: fetchError } = await supabaseAdmin
                .from('bill_configurations')
                .select('*')
                .eq('id', configId)
                .single();

            if (fetchError || !config) {
                throw new Error("Bill configuration not found");
            }

            // Update status to active
            const { data: updatedConfig, error: updateError } = await supabaseAdmin
                .from('bill_configurations')
                .update({
                    status: 'active',
                    published_at: new Date().toISOString()
                })
                .eq('id', configId)
                .select()
                .single();

            if (updateError) {
                throw new Error(updateError.message);
            }

            // Build a human-readable services list and compute config-level total
            const totalAmount = (config.services || []).reduce((sum, service) => {
                return sum + (Number(service.unit_cost || 0) * Number(service.number_of_units || 0));
            }, 0);

            const servicesList = (config.services || [])
                .map(s => `${s.name}: ${Number(s.unit_cost || 0).toLocaleString('vi-VN')}đ/${s.unit} × ${s.number_of_units}`)
                .join(', ');

            // Generate bills for every apartment based on configuration and any resident-submitted units
            const { data: apartments, error: aptErr } = await supabaseAdmin
                .from('apartments')
                .select('apt_id, owner_name')
                .order('apt_id', { ascending: true });

            if (aptErr) {
                console.warn('Unable to retrieve apartments: ', aptErr.message);
            }

            let created = 0;
            if (apartments && apartments.length > 0) {
                for (const apt of apartments) {
                    try {
                        // fetch any existing bill data to preserve pre_debt and previously submitted units
                        const { data: existingData, error: fetchBillErr } = await this.repo.query(apt.apt_id);
                        let existing = null;
                        if (!fetchBillErr && existingData && existingData.length > 0) existing = existingData[0];

                        const billObj = {
                            apt_id: apt.apt_id,
                            owner: apt.owner_name || (existing && existing.owner) || null,
                            pre_debt: Number(existing?.pre_debt || 0),
                            period: config.period
                        };

                        // compute per-service amounts
                        let servicesSum = 0;
                        for (const service of (config.services || [])) {
                            const name = (service.name || '').toString().toLowerCase();
                            const configQty = Number(service.number_of_units || 0);
                            const unitCost = Number(service.unit_cost || 0);
                            const amount = configQty * unitCost;

                            if (['điện','dien','electric','electricity'].some(k => name.includes(k))) {
                                billObj.electric = amount;
                            } else if (['nước','nuoc','water'].some(k => name.includes(k))) {
                                billObj.water = amount;
                            } else if (['xe','vehicle','vehicles'].some(k => name.includes(k))) {
                                billObj.vehicles = amount;
                            } else if (['vệ sinh','vesinh','ve sinh','service','services'].some(k => name.includes(k))) {
                                billObj.service = amount;
                            }

                            servicesSum += amount;
                        }

                        // Calculate vehicle fees automatically from vehicles table if not specified
                        if (!billObj.vehicles) {
                            try {
                                const { data: vehiclesData, error: vehiclesErr } = await supabaseAdmin
                                    .from('vehicles')
                                    .select('monthly_fee')
                                    .eq('apt_id', apt.apt_id)
                                    .eq('status', 'active');
                                
                                if (!vehiclesErr && vehiclesData && vehiclesData.length > 0) {
                                    const vehicleFees = vehiclesData.reduce((sum, v) => sum + Number(v.monthly_fee || 0), 0);
                                    billObj.vehicles = vehicleFees;
                                    servicesSum += vehicleFees;
                                }
                            } catch (vehicleErr) {
                                console.warn(`Failed to calculate vehicle fees for ${apt.apt_id}:`, vehicleErr);
                            }
                        }

                        // Upsert bill for apartment (total is calculated dynamically by DB queries and UI)
                        const { data: upserted, error: upsertErr } = await this.repo.upsert(billObj);
                        if (upsertErr) {
                            console.warn(`Failed to upsert bill for ${apt.apt_id}: ${upsertErr.message}`);
                            continue;
                        }
                        created += 1;
                    } catch (e) {
                        console.error(`Error generating bill for ${apt.apt_id}:`, e.message || e);
                        continue;
                    }
                }
            }

            // Notify all clients about the bill setup
            await notifyAllClients(
                'warning',
                `Cấu hình hóa đơn tháng ${config.period}`,
                `Vui lòng thanh toán hóa đơn tháng ${config.period}. Dịch vụ: ${servicesList}. Tổng tiền (dự kiến): ${totalAmount?.toLocaleString('vi-VN')}đ`,
                '/payments',
                {
                    period: config.period,
                    services: config.services,
                    totalAmount: totalAmount
                }
            );

            return res.status(200).json({
                message: "Bill configuration published, bills generated and all clients notified",
                data: updatedConfig,
                totalAmount: totalAmount,
                billsCreated: created,
                clientsNotified: true
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    // Residents submit their measured units for services (e.g., water, parking)
    async submitUnits(req, res) {
        try {
            const { apt_id, units, period: reqPeriod } = req.body; // units: [{ name, units }]
            const userId = req.user?.id || null;

            if (!apt_id || !units || !Array.isArray(units)) {
                throw new Error('apt_id and units array are required');
            }

            // Get latest active bill configuration
            const { data: config, error: cfgErr } = await supabaseAdmin
                .from('bill_configurations')
                .select('*')
                .eq('status', 'active')
                .order('published_at', { ascending: false })
                .limit(1)
                .single();

            if (cfgErr || !config) {
                throw new Error('No active bill configuration found');
            }

            // Map services by lowercased name for lookup
            const svcMap = {};
            (config.services || []).forEach((s) => {
                if (!s || !s.name) return;
                svcMap[s.name.toString().toLowerCase()] = s;
            });

            // Fetch existing bill for apt to combine totals
            const { data: existingBills, error: fetchBillErr } = await this.repo.query(apt_id);
            let existing = null;
            if (!fetchBillErr && existingBills && existingBills.length > 0) existing = existingBills[0];

            const updateObj = { apt_id };
            let addedTotal = 0;

            for (const u of units) {
                const name = (u.name || '').toString();
                const qty = Number(u.units || 0);
                if (!name) continue;
                const key = name.toLowerCase();
                const svc = svcMap[key];
                if (!svc) continue; // ignore unknown services

                const amount = qty * Number(svc.unit_cost || 0);
                addedTotal += amount;

                // update common numeric fields
                if (['điện','dien','electric','electricity'].some(k => key.includes(k))) {
                    updateObj.electric = (Number(existing?.electric) || 0) + amount;
                } else if (['nước','nuoc','water'].some(k => key.includes(k))) {
                    updateObj.water = (Number(existing?.water) || 0) + amount;
                } else if (['xe','vehicle','vehicles'].some(k => key.includes(k))) {
                    updateObj.vehicles = (Number(existing?.vehicles) || 0) + amount;
                } else if (['vệ sinh','vesinh','ve sinh','service','services'].some(k => key.includes(k))) {
                    updateObj.service = (Number(existing?.service) || 0) + amount;
                }
            }

            // Attach period: prefer request-specified period, fall back to active configuration period
            updateObj.period = reqPeriod || (config && config.period) || null;

            // Compute new total: start from existing total (if any) minus any previous per-resident amounts for the same services, then add new
            let baseTotal = 0;
            if (existing) {
                for (const [k, v] of Object.entries(existing)) {
                    if (k.endsWith('_amount') || k.endsWith('_units')) continue;
                    if (k === 'total') continue;
                    if (typeof v === 'number') baseTotal += v;
                }
            }

            // Ensure apartment exists or auto-create it
            const aptRecord = await ensureApartmentExists(apt_id);
            if (!aptRecord) {
                return res.status(400).json({ message: `Không thể tìm thấy hoặc tự động tạo căn hộ: ${apt_id}` });
            }

            const dbAptId = aptRecord.apt_id;
            updateObj.apt_id = dbAptId;

            // Ensure owner is set (use existing bill owner or apartment.owner_name)
            if (!updateObj.owner) updateObj.owner = (existing && existing.owner) || aptRecord.owner_name || '';

            // Upsert bill record for the apartment
            const { data: upserted, error: upsertErr } = await this.repo.upsert(updateObj);
            if (upsertErr) throw new Error(upsertErr.message);

            // Notify apartment owner that their units were recorded
            const ownerId = await getApartmentOwnerUserId(dbAptId);
            if (ownerId) {
                await createNotification(
                    ownerId,
                    'info',
                    'Số liệu tiêu thụ đã được ghi nhận',
                    `Số liệu tiêu thụ cho căn hộ ${dbAptId} đã được cập nhật. Tổng cộng thêm: ${addedTotal?.toLocaleString('vi-VN')}đ`,
                    '/payments',
                    { apt_id: dbAptId, addedTotal }
                );
            }

            return res.status(200).json({ message: 'Units submitted', data: upserted, addedTotal });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    // Bulk submit measured units for multiple apartments
    async submitBulk(req, res) {
        try {
            const { rows } = req.body; // rows: [{ apt_id, services: [{name, units}] }]
            if (!rows || !Array.isArray(rows)) throw new Error('rows array is required');

            // Get latest active bill configuration
            const { data: config, error: cfgErr } = await supabaseAdmin
                .from('bill_configurations')
                .select('*')
                .eq('status', 'active')
                .order('published_at', { ascending: false })
                .limit(1)
                .single();

            if (cfgErr || !config) {
                throw new Error('No active bill configuration found');
            }

            const svcMap = {};
            (config.services || []).forEach((s) => {
                if (!s || !s.name) return;
                svcMap[s.name.toString().toLowerCase()] = s;
            });

            const processed = [];

            for (const r of rows) {
                const apt_id = r.apt_id || r.aptId || r.apartment || null;
                const services = Array.isArray(r.services) ? r.services : [];
                if (!apt_id) continue;

                // Ensure apartment exists or auto-create it
                const aptRecord = await ensureApartmentExists(apt_id);
                if (!aptRecord) {
                    processed.push({ apt_id, status: 'error', message: `Không thể tạo hoặc tìm căn hộ: ${apt_id}` });
                    continue;
                }

                const dbAptId = aptRecord.apt_id;

                // fetch existing
                const { data: existingBills, error: fetchBillErr } = await this.repo.query(dbAptId);
                let existing = null;
                if (!fetchBillErr && existingBills && existingBills.length > 0) existing = existingBills[0];

                const updateObj = { apt_id: dbAptId };
                let addedTotal = 0;

                for (const s of services) {
                    const name = (s.name || '').toString();
                    const qty = Number(s.units || 0);
                    if (!name) continue;
                    const key = name.toLowerCase();
                    const cfg = svcMap[key];
                    if (!cfg) continue;
                    const amount = qty * Number(cfg.unit_cost || 0);
                    addedTotal += amount;

                    // set numeric fields for common services
                    if (['điện','dien','electric','electricity'].some(k => key.includes(k))) {
                        updateObj.electric = (Number(existing?.electric) || 0) + amount;
                    } else if (['nước','nuoc','water'].some(k => key.includes(k))) {
                        updateObj.water = (Number(existing?.water) || 0) + amount;
                    } else if (['xe','vehicle','vehicles','xe'].some(k => key.includes(k))) {
                        updateObj.vehicles = (Number(existing?.vehicles) || 0) + amount;
                    } else if (['vệ sinh','vesinh','ve sinh','service','services'].some(k => key.includes(k))) {
                        updateObj.service = (Number(existing?.service) || 0) + amount;
                    }
                }

                // Attach period: prefer request-specified period (from bulk body), fall back to active config
                updateObj.period = (req.body && req.body.period) || (config && config.period) || null;

                // Ensure owner is set for this apartment
                if (!updateObj.owner) updateObj.owner = (existing && existing.owner) || aptRecord.owner_name || '';

                const { data: upserted, error: upsertErr } = await this.repo.upsert(updateObj);
                if (upsertErr) {
                    processed.push({ apt_id: dbAptId, status: 'error', message: upsertErr.message });
                    continue;
                }

                // notify owner
                const ownerId = await getApartmentOwnerUserId(dbAptId);
                if (ownerId) {
                    await createNotification(
                        ownerId,
                        'info',
                        'Số liệu tiêu thụ đã được ghi nhận',
                        `Số liệu tiêu thụ cho căn hộ ${dbAptId} đã được cập nhật từ import. Tổng cộng thêm: ${addedTotal?.toLocaleString('vi-VN')}đ`,
                        '/payments',
                        { apt_id: dbAptId, addedTotal }
                    );
                }

                processed.push({ apt_id: dbAptId, status: 'ok', upserted });
            }

            return res.status(200).json({ message: 'Bulk submit processed', processed });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getBillConfiguration(req, res) {
        try {
            const { configId } = req.params;

            if (!configId) {
                throw new Error("Configuration ID is required");
            }

            const { data, error } = await supabaseAdmin
                .from('bill_configurations')
                .select('*')
                .eq('id', configId)
                .single();

            if (error) {
                throw new Error("Bill configuration not found");
            }

            return res.status(200).json({
                message: "Success",
                data: data
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getAllBillConfigurations(req, res) {
        try {
            const { status } = req.query;
            let query = supabaseAdmin
                .from('bill_configurations')
                .select('*')
                .order('created_at', { ascending: false });

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) {
                throw new Error(error.message);
            }

            return res.status(200).json({
                message: "Success",
                data: data || []
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

        // Return available billing periods from configurations and existing bills
        async getAvailablePeriods(req, res) {
            try {
                const { data: cfgs, error: cfgErr } = await supabaseAdmin
                    .from('bill_configurations')
                    .select('period')
                    .neq('period', null);

                if (cfgErr) console.warn('Error fetching config periods:', cfgErr.message);

                const { data: bills, error: billsErr } = await supabaseAdmin
                    .from('bills')
                    .select('period')
                    .neq('period', null);

                if (billsErr) console.warn('Error fetching bill periods:', billsErr.message);

                const periods = new Set();
                (cfgs || []).forEach(c => c && c.period && periods.add(c.period));
                (bills || []).forEach(b => b && b.period && periods.add(b.period));

                const sorted = Array.from(periods).sort().reverse();
                return res.status(200).json({ message: 'Success', periods: sorted });
            } catch (error) {
                return res.status(500).json({ message: error.message });
            }
        }

    // Export current bills as CSV (admin/manager)
    async exportBills(req, res) {
        try {
            const { data: bills, error } = await supabaseAdmin
                .from('bills')
                .select('*, apartments(apt_id, owner_name)')
                .order('apt_id', { ascending: true });

            if (error) throw error;

            const rows = bills || [];

            // Build CSV headers - include common fields and any dynamic _amount/_units fields
            const headersSet = new Set(['apt_id', 'owner_name', 'pre_debt', 'total', 'electric', 'water', 'service', 'vehicles']);
            rows.forEach(r => {
                Object.keys(r).forEach(k => {
                    if (k.endsWith('_amount') || k.endsWith('_units')) headersSet.add(k);
                });
            });

            const headers = Array.from(headersSet);

            const csvLines = [];
            csvLines.push(headers.join(','));

            for (const r of rows) {
                const values = headers.map(h => {
                    if (h === 'owner_name') return r.apartments ? (`"${(r.apartments.owner_name || '').toString().replace(/"/g,'""')}"`) : '';
                    const val = r[h] !== undefined ? r[h] : '';
                    if (typeof val === 'string') return `"${val.replace(/"/g,'""')}"`;
                    return val;
                });
                csvLines.push(values.join(','));
            }

            const csv = csvLines.join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="bills_export_${new Date().toISOString()}.csv"`);
            return res.status(200).send(csv);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async updateBillConfiguration(req, res) {
        try {
            const { configId } = req.params;
            const { services, period } = req.body;

            if (!configId) {
                throw new Error("Configuration ID is required");
            }

            // Get the configuration first
            const { data: config, error: fetchError } = await supabaseAdmin
                .from('bill_configurations')
                .select('*')
                .eq('id', configId)
                .single();

            if (fetchError || !config) {
                throw new Error("Bill configuration not found");
            }

            // Only allow updates if status is draft
            if (config.status !== 'draft') {
                throw new Error("Can only update configurations in draft status");
            }

            // Validate services if provided - number_of_units is optional for price configs
            if (services && Array.isArray(services)) {
                services.forEach((service, index) => {
                    if (!service.name || service.unit_cost === undefined || !service.unit) {
                        throw new Error(`Service ${index}: name, unit_cost, and unit are required`);
                    }
                    if (service.number_of_units !== undefined && (isNaN(service.number_of_units) || service.number_of_units < 0)) {
                        throw new Error(`Service ${index}: number_of_units must be a non-negative number if provided`);
                    }
                });
            }

            const updateData = {};
            if (period) updateData.period = period;
            if (services) updateData.services = services;

            const { data: updatedConfig, error: updateError } = await supabaseAdmin
                .from('bill_configurations')
                .update(updateData)
                .eq('id', configId)
                .select()
                .single();

            if (updateError) {
                throw new Error(updateError.message);
            }

            return res.status(200).json({
                message: "Bill configuration updated successfully",
                data: updatedConfig
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async deleteBillConfiguration(req, res) {
        try {
            const { configId } = req.params;

            if (!configId) {
                throw new Error("Configuration ID is required");
            }

            // Get the configuration first
            const { data: config, error: fetchError } = await supabaseAdmin
                .from('bill_configurations')
                .select('status')
                .eq('id', configId)
                .single();

            if (fetchError || !config) {
                throw new Error("Bill configuration not found");
            }

            // Only allow deletion if status is draft
            if (config.status !== 'draft') {
                throw new Error("Can only delete configurations in draft status");
            }

            const { error: deleteError } = await supabaseAdmin
                .from('bill_configurations')
                .delete()
                .eq('id', configId);

            if (deleteError) {
                throw new Error(deleteError.message);
            }

            return res.status(200).json({
                message: "Bill configuration deleted successfully"
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}

module.exports = {
    BillController
};