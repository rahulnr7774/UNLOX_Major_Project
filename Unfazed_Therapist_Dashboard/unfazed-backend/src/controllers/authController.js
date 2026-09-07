const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const { generateUniqueSlug } = require('../utils/generateSlug');
const { sendNotification } = require('../services/notificationService');

function createToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicTherapist(therapist) {
  const value = therapist.toObject ? therapist.toObject() : { ...therapist };
  delete value.password_hash;
  return value;
}

async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

  const normalizedEmail = email.trim().toLowerCase();
  if (await Therapist.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'Email is already registered' });

  const password_hash = await bcrypt.hash(password, 12);
  const slug = await generateUniqueSlug(name, Therapist);
  const therapist = await Therapist.create({ name: name.trim(), email: normalizedEmail, password_hash, slug });
  await sendNotification({ channel: 'email', recipient: normalizedEmail, subject: 'Welcome to Unfazed', message: 'Your therapist account is ready.' });

  return res.status(201).json({ token: createToken(therapist._id, 'therapist'), therapist: publicTherapist(therapist) });
}

async function login(req, res) {
  const normalizedEmail = req.body.email?.trim().toLowerCase();
  const therapist = await Therapist.findOne({ email: normalizedEmail }).select('+password_hash');
  if (therapist && await bcrypt.compare(req.body.password || '', therapist.password_hash)) {
    return res.status(200).json({ token: createToken(therapist._id, 'therapist'), therapist: publicTherapist(therapist) });
  }

  const client = await Client.findOne({ email: normalizedEmail }).select('+password_hash');
  if (client?.password_hash && await bcrypt.compare(req.body.password || '', client.password_hash)) {
    const value = client.toObject();
    delete value.password_hash;
    return res.status(200).json({ token: createToken(client._id, 'client'), client: value });
  }

  return res.status(401).json({ message: 'Invalid email or password' });
}

async function getCurrentTherapist(req, res) {
  return res.status(200).json({ therapist: req.therapist });
}

module.exports = { register, login, getCurrentTherapist };
