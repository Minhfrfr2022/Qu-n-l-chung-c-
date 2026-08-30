const residentService = require('../repositories/residentService');

const mapResident = (r) => ({
  ...r,
  yearOfBirth: r.year_of_birth || null,
  hometown: r.hometown || null,
  gender: r.gender || null,
  cccd: r.cccd || null
});

exports.list = async (req, res) => {
  try {
    const { apt_id } = req.params;
    if (!apt_id) throw new Error('Missing apt_id');
    const data = await residentService.listByApartment(apt_id);
    res.status(200).json({ success: true, data: (data || []).map(mapResident) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// List all residents (no filter)
exports.listAll = async (req, res) => {
  try {
    const data = await residentService.listAll();
    res.status(200).json({ success: true, data: (data || []).map(mapResident) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get resident by user_id
exports.getByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) throw new Error('Missing user_id');
    const data = await residentService.getByUserId(user_id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Resident not found for this user' });
    }
    res.status(200).json({ success: true, data: mapResident(data) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = req.body || {};
    // basic validation: require apt_id and full_name
    if (!payload.apt_id || !payload.full_name) throw new Error('Missing apt_id or full_name');
    
    // Validate apartment exists
    const { supabaseAdmin } = require('../config/supabase');
    const { data: apartment, error: aptError } = await supabaseAdmin
      .from('apartments')
      .select('apt_id')
      .eq('apt_id', payload.apt_id)
      .single();

    if (aptError || !apartment) {
      throw new Error(`Apartment ${payload.apt_id} does not exist. Please create the apartment first.`);
    }

    // If user_id is provided, validate it and check for duplicates
    if (payload.user_id) {
      // Check if this user already has a resident record
      const { data: existingResident } = await supabaseAdmin
        .from('residents')
        .select('id')
        .eq('user_id', payload.user_id)
        .single();

      if (existingResident) {
        throw new Error('This user already has a resident record. Each user can only have one resident profile.');
      }

      // Validate user exists
      const { data: user } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .eq('id', payload.user_id)
        .single();

      if (!user) {
        throw new Error('User not found');
      }
    }

    // normalize numeric yearOfBirth
    if (payload.yearOfBirth && !Number.isInteger(payload.yearOfBirth)) {
      const asNum = parseInt(payload.yearOfBirth, 10);
      if (Number.isNaN(asNum)) throw new Error('Invalid yearOfBirth');
      payload.yearOfBirth = asNum;
    }

    const data = await residentService.createResident(payload);
    res.status(201).json({ success: true, data: mapResident(data) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// NEW: Link resident to user account
exports.linkToUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      throw new Error('user_id is required');
    }

    const data = await residentService.linkResidentToUser(id, user_id);
    res.status(200).json({ success: true, data, message: 'Resident linked to user successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// NEW: Update resident
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    if (!id) throw new Error('Missing resident id');

    // normalize numeric yearOfBirth
    if (payload.yearOfBirth && !Number.isInteger(payload.yearOfBirth)) {
      const asNum = parseInt(payload.yearOfBirth, 10);
      if (Number.isNaN(asNum)) throw new Error('Invalid yearOfBirth');
      payload.yearOfBirth = asNum;
    }

    const data = await residentService.updateResident(id, payload);
    res.status(200).json({ success: true, data: mapResident(data) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_owner_id } = req.body || {};
    if (!id) throw new Error('Missing resident id');
    await residentService.deleteResident(id, { new_owner_id });
    res.status(200).json({ success: true, message: 'Resident deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
