const { supabaseAdmin } = require('../config/supabase');

// Create population movement
exports.createMovement = async (payload) => {
  const {
    resident_id,
    apt_id,
    movement_type,
    reason,
    start_date,
    end_date,
    requested_by,
    notes
  } = payload;

  if (!resident_id || !apt_id || !movement_type || !start_date) {
    throw new Error('Missing required fields: resident_id, apt_id, movement_type, start_date');
  }

  const { data, error } = await supabaseAdmin
    .from('population_movements')
    .insert([{
      resident_id,
      apt_id,
      movement_type,
      reason,
      start_date,
      end_date,
      requested_by,
      notes,
      status: 'pending'
    }])
    .select();

  if (error) throw error;
  return data[0];
};

// List movements for an apartment
exports.listByApartment = async (apt_id, status = null) => {
  let query = supabaseAdmin
    .from('population_movements')
    .select(`
      *,
      resident:resident_id(id, full_name, phone, cccd, apt_id)
    `)
    .eq('apt_id', apt_id)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

// List movements for a resident
exports.listByResident = async (resident_id) => {
  const { data, error } = await supabaseAdmin
    .from('population_movements')
    .select('*')
    .eq('resident_id', resident_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get movement by ID
exports.getById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('population_movements')
    .select(`
      *,
      resident:resident_id(id, full_name, phone, cccd, apt_id)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// Update movement status (approve/reject)
exports.updateStatus = async (id, status, approved_by) => {
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw new Error('Invalid status. Must be pending, approved, or rejected');
  }

  const updateData = {
    status,
    ...(status !== 'pending' && { approved_by, approved_at: new Date().toISOString() })
  };

  const { data, error } = await supabaseAdmin
    .from('population_movements')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
};

// Delete movement
exports.deleteMovement = async (id) => {
  const { error } = await supabaseAdmin
    .from('population_movements')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Get pending movements for admin approval
exports.getPending = async () => {
  const { data, error } = await supabaseAdmin
    .from('population_movements')
    .select(`
      *,
      resident:resident_id(id, full_name, phone, cccd, apt_id)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get all movements or filter by status
exports.getByStatus = async (status = null) => {
  let query = supabaseAdmin
    .from('population_movements')
    .select(`
      *,
      resident:resident_id(id, full_name, phone, cccd, apt_id)
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};
