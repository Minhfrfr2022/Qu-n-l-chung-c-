const { supabase, supabaseAdmin } = require('../config/supabase.js');

/**
 * Get all apartments (paginated)
 */
exports.getAllApartmentsPaginated = async (offset = 0, limit = 20) => {
  const { data, error, count } = await supabaseAdmin
    .from('apartments')
    .select('*', { count: 'exact' })
    .order('apt_id', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[ApartmentService] error fetching apartments:', error.message);
    throw error;
  }

  console.log('[ApartmentService] DB returned rows:', data?.length || 0);
  return { data: data || [], total: count || 0 };
};

/**
 * Search apartments
 */
exports.searchApartmentsPaginated = async (queryString, offset = 0, limit = 20) => {
  let query = supabaseAdmin
    .from('apartments')
    .select('*', { count: 'exact' });

  if (queryString && queryString.trim() !== '') {
    const searchTerm = queryString.trim();
    query = query.or(
      `owner_name.ilike.%${searchTerm}%,owner_phone.ilike.%${searchTerm}%,apt_id.ilike.%${searchTerm}%`
    );
  }

  const { data, error, count } = await query
    .order('apt_id', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return { data: data || [], total: count || 0 };
};

/**
 * Create apartment
 */
exports.createApartment = async (apartmentData) => {
  if (!apartmentData || typeof apartmentData !== 'object') {
    throw new Error('Invalid apartment data');
  }

  // Validate required fields
  if (!apartmentData.apt_id) {
    throw new Error('Apartment ID (apt_id) is required');
  }

  // Check if apartment already exists
  const { data: existing } = await supabaseAdmin
    .from('apartments')
    .select('apt_id')
    .eq('apt_id', apartmentData.apt_id)
    .single();

  if (existing) {
    throw new Error(`Apartment ${apartmentData.apt_id} already exists`);
  }

  // Set default values
  const payload = {
    ...apartmentData,
    resident_count: apartmentData.resident_count || 0,
    status: apartmentData.status || 'vacant'
  };

  const { data, error } = await supabaseAdmin
    .from('apartments')
    .insert([payload])   
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update apartment
 */
exports.updateApartment = async (apt_id, updateData) => {
  const { data, error } = await supabaseAdmin
    .from('apartments')
    .update(updateData)
    .eq('apt_id', apt_id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete apartment
 */
exports.deleteApartment = async (apt_id) => {
  const { error } = await supabaseAdmin
    .from('apartments')
    .delete()
    .eq('apt_id', apt_id);

  if (error) throw error;
  return true;
};
/**
 * Thêm hàm lấy chi tiết một apartment
 */
exports.getApartmentById = async (apt_id) => {
  const { data, error } = await supabaseAdmin
    .from('apartments')
    .select('*')
    .eq('apt_id', apt_id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { 
      throw new Error('Căn hộ không tồn tại');
    }
    throw error;
  }

  return data;
};
