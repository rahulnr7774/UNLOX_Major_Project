const nodemailer = require('nodemailer');

const emailTransporter = nodemailer.createTransport({
	service: process.env.EMAIL_SERVICE || 'gmail',
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
