const nodemailer = require('nodemailer');

const emailTransporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST || 'smtp.gmail.com',
	port: Number(process.env.EMAIL_PORT || 587),
	secure: process.env.EMAIL_SECURE === 'true',
	requireTLS: true,
	family: 4,
	connectionTimeout: 15000,
	greetingTimeout: 15000,
	socketTimeout: 20000,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD
	}
});

module.exports = emailTransporter;
