const {supabaseAdmin} = require("../config/supabase");

class BillRepository {
    async insert(
        bill
    ) {
        const res = await supabaseAdmin
        .from('bills')
        .insert(bill)
        .select()
        return res
    }

    async update(
        update_field,
        apt_id
    ) {
        // support calling update with either:
        // update_field = { ...fields, period? } and apt_id = 'A1'
        // or apt_id = { apt_id: 'A1', period: '2025-07' } for explicit targeting
        let period = null;
        if (update_field && update_field.period) period = update_field.period;
        let query = supabaseAdmin.from('bills').update(update_field);

        if (apt_id && typeof apt_id === 'object') {
            if (apt_id.apt_id) query = query.eq('apt_id', apt_id.apt_id);
            if (apt_id.period) query = query.eq('period', apt_id.period);
        } else {
            query = query.eq('apt_id', apt_id);
            if (period) query = query.eq('period', period);
        }

        const res = await query.select();
        return res;
    }

    async upsert(bill) {
        // Upsert should consider period as part of the uniqueness key so the same apartment
        // can have bills for multiple periods. Ensure callers include `period` on the bill.
        const onConflict = Array.isArray(bill) ? ['apt_id','period'] : ['apt_id','period'];
        const res = await supabaseAdmin
        .from('bills')
        .upsert(bill, { onConflict })
        .select();
        return res;
    }

    async query(apt_id) {
        // Return bills for the apartment ordered by period desc (most recent first)
        const res = await supabaseAdmin
        .from('bills')
        .select('*')
        .eq('apt_id', apt_id)
        .order('period', { ascending: false });
        return res;
    }

    async query_with_range(start, end) {
        const res = await supabaseAdmin
        .from('bills')
        .select('*')
        .order('apt_id', {ascending: false})
        .range(start, end);
        return res 
    }

    async query_by_owner(owner, start, end) {
        const res = await supabaseAdmin
        .from('bills')
        .select('*')
        .eq('owner', owner)
        .order('apt_id', {ascending: true})
        .range(start, end);

        return res;
    }

    async count_all_bills_by_owner(owner) {
        const res = await supabaseAdmin
        .from('bills')
        .select('*', {count: 'exact', head: true})
        .eq('owner', owner);

        return res;
    }

    async count_all_docs() {
        const res = await supabaseAdmin
        .from('bills')
        .select('*', {count: 'exact', head: true});
        return res 
    }

    async query_with_filter(filter, start, end) {
        let res = supabaseAdmin
        .from('bills')
        .select('*');

        if(filter) {
            Object.entries(filter).forEach(([key, value]) => {
                res = res.eq(key, value);
            })
        }

        res = res.order('apt_id', {ascending: true}).range(start, end);
        const final = await res;
        return final;
    }

    async count_all_with_filter(filter) {
        let query = supabaseAdmin
        .from('bills')
        .select('*', {count: 'exact', head: true});

        if(filter)
        Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value);
        })

        const res = await query;
        return res;
    }

    async query_all_collected() {
        let res = await supabaseAdmin
        .rpc('get_total_collected')

        return res;
    }

    async getBillAnalytics() {
        const res = await supabaseAdmin
            .from('bill_analytics')
            .select('*')
            .order('period', { ascending: false });
        return res;
    }

    async getPaymentStats(period = null) {
        const res = await supabaseAdmin
            .rpc('get_payment_stats', { p_period: period });
        return res;
    }

    async getApartmentBillHistory(apt_id) {
        const res = await supabaseAdmin
            .rpc('get_apartment_bill_history', { p_apt_id: apt_id });
        return res;
    }

    async updateBillStatus(apt_id, period, status) {
        const res = await supabaseAdmin
            .from('bills')
            .update({ status })
            .eq('apt_id', apt_id)
            .eq('period', period)
            .select();
        return res;
    }

    async markBillAsPaid(apt_id, period, payment_method = null) {
        const res = await supabaseAdmin
            .from('bills')
            .update({ 
                paid: true, 
                paid_at: new Date().toISOString(),
                status: 'paid',
                payment_method
            })
            .eq('apt_id', apt_id)
            .eq('period', period)
            .select();
        return res;
    }

    async addLateFee(apt_id, period, late_fee) {
        const res = await supabaseAdmin
            .from('bills')
            .update({ late_fee })
            .eq('apt_id', apt_id)
            .eq('period', period)
            .select();
        return res;
    }

    async applyDiscount(apt_id, period, discount) {
        const res = await supabaseAdmin
            .from('bills')
            .update({ discount })
            .eq('apt_id', apt_id)
            .eq('period', period)
            .select();
        return res;
    }

    async getOverdueBills() {
        const res = await supabaseAdmin
            .from('bills')
            .select('*')
            .eq('status', 'overdue')
            .order('due_date', { ascending: true });
        return res;
    }

    async sendReminder(apt_id, period) {
        const res = await supabaseAdmin
            .from('bills')
            .update({ 
                last_reminder_sent: new Date().toISOString(),
                reminder_count: supabaseAdmin.raw('reminder_count + 1')
            })
            .eq('apt_id', apt_id)
            .eq('period', period)
            .select();
        return res;
    }

    async accrue_fee(apt_id, total) {
        // Record a payment entry in the `payments` table. `period` should be provided by caller
        // If caller wants to aggregate totals, use DB-side RPC or a separate aggregation table.
        const payload = typeof total === 'object' && total !== null ? total : { apt_id, amount: total };
        let res = await supabaseAdmin
        .from('payments')
        .insert(payload)
        .select();
        return res;
    }

    async findPayments(apt_id, period) {
        const query = supabaseAdmin.from('payments').select('*');
        if (apt_id) query.eq('apt_id', apt_id);
        if (period) query.eq('period', period);
        const res = await query;
        return res;
    }
}


module.exports = {
    BillRepository
};