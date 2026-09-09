const Therapist = require('../models/Therapist');
const Package = require('../models/Package');
const { generateUniqueSlug } = require('../utils/generateSlug');

async function getProfile(req, res) {
  return res.status(200).json({ therapist: req.therapist });
}

async function updateProfile(req, res) {
  const allowedFields = ['name', 'bio', 'profile_image', 'specializations', 'languages'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
  if (updates.profile_image) {
    const isImageDataUrl = /^data:image\/(jpeg|png|webp);base64,/.test(updates.profile_image);
    if (!isImageDataUrl || updates.profile_image.length > 3000000) {
      return res.status(400).json({ message: 'Profile picture must be a JPG, PNG or WebP image smaller than 2 MB.' });
    }
  }
  if (updates.name) updates.slug = await generateUniqueSlug(updates.name, Therapist, req.therapist._id);

  const therapist = await Therapist.findByIdAndUpdate(req.therapist._id, updates, {
    new: true,
    runValidators: true
  }).select('-password_hash');
  return res.status(200).json({ therapist });
}

async function getPublicProfile(req, res) {
  const therapist = await Therapist.findOne({ slug: req.params.slug }).select('-password_hash -subscription_tier');
  if (!therapist) return res.status(404).json({ message: 'Therapist profile not found' });
  const packages = await Package.find({ therapist_id: therapist._id, active: true }).select('name description session_count per_session_rate total_price expiry_days').sort({ session_count: 1 });
  return res.status(200).json({ therapist, packages });
}

module.exports = { getProfile, updateProfile, getPublicProfile };
