const nodemailer = require('nodemailer');
require('dotenv').config();

const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,

  family: 4
});

emailTransporter.verify()
  .then(() => {
    console.log(' SMTP connection successful');
  })
  .catch((err) => {
    console.error(' SMTP connection failed:', err);
  });

module.exports = emailTransporter;