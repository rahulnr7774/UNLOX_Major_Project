const nodemailer = require('nodemailer');

const emailTransporter = nodemailer.createTransport({
	service: process.env.EMAIL_SERVICE || 'gmail',
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD
	}
});

module.exports = emailTransporter;
