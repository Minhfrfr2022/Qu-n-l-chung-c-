const express = require('express');
const router = express.Router();
const { buildingInfo, regulations } = require('../data/buildingData');

// GET building info
router.get('/info', (req, res) => {
  res.json(buildingInfo);
});

// GET all regulations
router.get('/regulations', (req, res) => {
  res.json(regulations);
});

// GET single regulation
router.get('/regulations/:id', (req, res) => {
  const regulation = regulations.find(r => r.id === req.params.id);
  if (regulation) {
    res.json(regulation);
  } else {
    res.status(404).json({ error: 'Regulation not found' });
  }
});

// PUT update building info
router.put('/info', (req, res) => {
  const { name, address, manager, managerPhone, managerEmail, securityPhone, frontDeskPhone } = req.body;

  if (name) buildingInfo.name = name;
  if (address) buildingInfo.address = address;
  if (manager) buildingInfo.manager = manager;
  if (managerPhone) buildingInfo.managerPhone = managerPhone;
  if (managerEmail) buildingInfo.managerEmail = managerEmail;
  if (securityPhone) buildingInfo.securityPhone = securityPhone;
  if (frontDeskPhone) buildingInfo.frontDeskPhone = frontDeskPhone;

  res.json(buildingInfo);
});

// POST new regulation
router.post('/regulations', (req, res) => {
  const { title, description, icon } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newRegulation = {
    id: `R${String(regulations.length + 1).padStart(3, '0')}`,
    title,
    description,
    icon: icon || '📋'
  };

  regulations.push(newRegulation);
  res.status(201).json(newRegulation);
});

// PUT update regulation
router.put('/regulations/:id', (req, res) => {
  const regulation = regulations.find(r => r.id === req.params.id);

  if (!regulation) {
    return res.status(404).json({ error: 'Regulation not found' });
  }

  if (req.body.title) regulation.title = req.body.title;
  if (req.body.description) regulation.description = req.body.description;
  if (req.body.icon) regulation.icon = req.body.icon;

  res.json(regulation);
});

// DELETE regulation
router.delete('/regulations/:id', (req, res) => {
  const index = regulations.findIndex(r => r.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Regulation not found' });
  }

  const deleted = regulations.splice(index, 1);
  res.json(deleted[0]);
});

module.exports = router;
