const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const { generateUniqueSlug } = require('../utils/generateSlug');
const { sendNotification } = require('../services/notificationService');
const { isValidEmail, isValidPhone, isValidPassword } = require('../utils/validation');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function createToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicTherapist(therapist) {
  const value = therapist.toObject ? therapist.toObject() : { ...therapist };
  delete value.password_hash;
  return value;
}

function publicClient(client) {
  const value = client.toObject ? client.toObject() : { ...client };
  delete value.password_hash;
  return value;
}

async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (!isValidEmail(email)) return res.status(400).json({ message: 'Please enter a valid email address' });
  if (!isValidPassword(password)) return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character' });

  const normalizedEmail = email.trim().toLowerCase();
  if (await Therapist.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'Email is already registered' });

  const password_hash = await bcrypt.hash(password, 12);
  const slug = await generateUniqueSlug(name, Therapist);
  const therapist = await Therapist.create({ name: name.trim(), email: normalizedEmail, password_hash, slug });
  await sendNotification({ channel: 'email', recipient: normalizedEmail, subject: 'Welcome to Unfazed', message: 'Your therapist account is ready.' });

  return res.status(201).json({ token: createToken(therapist._id, 'therapist'), therapist: publicTherapist(therapist) });
}

async function registerClient(req, res) {
  const { name, email, password, phone, presenting_concern } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (!isValidEmail(email)) return res.status(400).json({ message: 'Please enter a valid email address' });
  if (phone && !isValidPhone(phone)) return res.status(400).json({ message: 'Phone number must contain exactly 10 digits' });
  if (!isValidPassword(password)) return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character' });

  const normalizedEmail = email.trim().toLowerCase();
  if (  await Client.exists({ email: normalizedEmail })) {
    return res.status(409).json({ message: 'Email is already registered' });
  }

  const client = await Client.create({
    name: name.trim(),
    email: normalizedEmail,
    phone,
    presenting_concern,
    password_hash: await bcrypt.hash(password, 12),
    approval_status: 'pending'
  });
  const Lead = require('../models/Lead');
  await Lead.create({
    name: client.name,
    email: client.email,
    phone: client.phone,
    presenting_concern: client.presenting_concern,
    converted_client_id: client._id,
    status: 'new'
  });

  return res.status(201).json({ token: createToken(client._id, 'client'), client: publicClient(client) });
}

async function login(req, res) {
  const normalizedEmail = req.body.email?.trim().toLowerCase();
  const therapist = await Therapist.findOne({ email: normalizedEmail }).select('+password_hash');
  if (therapist && await bcrypt.compare(req.body.password || '', therapist.password_hash)) {
    return res.status(200).json({ token: createToken(therapist._id, 'therapist'), therapist: publicTherapist(therapist) });
  }

  const client = await Client.findOne({ email: normalizedEmail }).select('+password_hash');
  if (client?.password_hash && await bcrypt.compare(req.body.password || '', client.password_hash)) {
    return res.status(200).json({ token: createToken(client._id, 'client'), client: publicClient(client) });
  }

  return res.status(401).json({ message: 'Invalid email or password' });
}

async function googleAuth(req, res) {
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: 'Google sign-in is not configured' });
  if (!req.body.credential) return res.status(400).json({ message: 'Google credential is required' });

  const ticket = await googleClient.verifyIdToken({
    idToken: req.body.credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const profile = ticket.getPayload();
  if (!profile?.email || !profile.email_verified) return res.status(401).json({ message: 'Your Google email could not be verified' });

  const email = profile.email.trim().toLowerCase();
  const requestedRole = req.body.role === 'client' ? 'client' : 'therapist';
  const existingTherapist = await Therapist.findOne({ email });
  if (existingTherapist) {
    if (requestedRole === 'client') return res.status(409).json({ message: 'This Google account is registered as a therapist.' });
    return res.status(200).json({ token: createToken(existingTherapist._id, 'therapist'), therapist: publicTherapist(existingTherapist) });
  }

  const existingClient = await Client.findOne({ email }).select('+password_hash');
  if (existingClient) {
    return res.status(200).json({ token: createToken(existingClient._id, 'client'), client: publicClient(existingClient) });
  }

  const name = profile.name?.trim() || profile.email.split('@')[0];
  if (requestedRole === 'client') {
    const client = await Client.create({
      name,
      email,
      password_hash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
      approval_status: 'pending'
    });
    const Lead = require('../models/Lead');
    await Lead.create({
      name: client.name,
      email: client.email,
      converted_client_id: client._id,
      status: 'new'
    });
    return res.status(201).json({ token: createToken(client._id, 'client'), client: publicClient(client) });
  }

  const slug = await generateUniqueSlug(name, Therapist);
  const therapist = await Therapist.create({
    name,
    email,
    password_hash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
    slug,
    profile_image: profile.picture || '',
  });
  await sendNotification({ channel: 'email', recipient: email, subject: 'Welcome to Unfazed', message: 'Your therapist account is ready.' });

  return res.status(201).json({ token: createToken(therapist._id, 'therapist'), therapist: publicTherapist(therapist) });
}

async function getCurrentTherapist(req, res) {
  return res.status(200).json({ therapist: req.therapist });
}

module.exports = { register, registerClient, login, googleAuth, getCurrentTherapist };
