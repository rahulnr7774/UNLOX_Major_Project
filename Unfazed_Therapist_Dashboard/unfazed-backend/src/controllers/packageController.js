const Package = require('../models/Package');

async function listPackages(req, res) {
  const packages = await Package.find({ therapist_id: req.therapist._id }).sort({ session_count: 1 });
  return res.status(200).json({ packages });
}

async function createPackage(req, res) {
  const { name, session_count, per_session_rate, total_price, expiry_days, description } = req.body;
  const count = Number(session_count);
  if (!name || !Number.isInteger(count) || count < 1 || count > 50 || Number(per_session_rate) <= 0 || Number(total_price) <= 0 || Number(expiry_days) <= 0) {
    return res.status(400).json({ message: 'Name, session count, rates and expiry are required' });
  }
  const packageRecord = await Package.create({ name, session_count: count, per_session_rate, total_price, expiry_days, description, therapist_id: req.therapist._id });
  return res.status(201).json({ package: packageRecord });
}

async function updatePackage(req, res) {
  const allowed = ['name', 'session_count', 'per_session_rate', 'total_price', 'expiry_days', 'description', 'active'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const packageRecord = await Package.findOneAndUpdate({ _id: req.params.id, therapist_id: req.therapist._id }, updates, { new: true, runValidators: true });
  if (!packageRecord) return res.status(404).json({ message: 'Package not found' });
  return res.status(200).json({ package: packageRecord });
}

module.exports = { listPackages, createPackage, updatePackage };