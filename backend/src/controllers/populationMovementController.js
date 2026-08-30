const populationMovementService = require('../repositories/populationMovementService');

// Create a new population movement
exports.create = async (req, res) => {
  try {
    const payload = req.body || {};
    const data = await populationMovementService.createMovement(payload);
    res.status(201).json({ success: true, data, message: 'Population movement created successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get movements for an apartment
exports.listByApartment = async (req, res) => {
  try {
    const { apt_id } = req.params;
    const { status } = req.query;
    if (!apt_id) throw new Error('Missing apt_id');
    
    const data = await populationMovementService.listByApartment(apt_id, status);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get movements for a resident
exports.listByResident = async (req, res) => {
  try {
    const { resident_id } = req.params;
    if (!resident_id) throw new Error('Missing resident_id');
    
    const data = await populationMovementService.listByResident(resident_id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get single movement
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) throw new Error('Missing id');
    
    const data = await populationMovementService.getById(id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Update movement status (approve/reject)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approved_by } = req.body;
    
    if (!id) throw new Error('Missing id');
    if (!status) throw new Error('Missing status');
    
    const data = await populationMovementService.updateStatus(id, status, approved_by);
    res.status(200).json({ success: true, data, message: `Movement ${status} successfully` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete movement
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) throw new Error('Missing id');
    
    await populationMovementService.deleteMovement(id);
    res.status(200).json({ success: true, message: 'Movement deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get pending movements for admin approval
exports.getPending = async (req, res) => {
  try {
    const data = await populationMovementService.getPending();
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get movements by status (or all if no status provided)
exports.getByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const data = await populationMovementService.getByStatus(status);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
