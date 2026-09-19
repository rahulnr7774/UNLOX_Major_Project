require('dotenv').config();

// function toBase64(content) {
// 	return Buffer.isBuffer(content)
// 		? content.toString('base64')
// 		: Buffer.from(String(content || '')).toString('base64');
// }

// const emailTransporter = {
// 	async sendMail({ from, to, subject, text, html, attachments = [] }) {
// 		const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_REST_API_KEY;
// 		if (!apiKey) throw new Error('RESEND_API_KEY must be configured');

// 		const response = await fetch('https://api.resend.com/emails', {
// 			method: 'POST',
// 			headers: {
// 				Authorization: `Bearer ${apiKey}`,
// 				'Content-Type': 'application/json',
// 			},
// 			body: JSON.stringify({
// 				from: process.env.RESEND_FROM_EMAIL || from || 'Unfazed <onboarding@resend.dev>',
// 				to: Array.isArray(to) ? to : [to],
// 				subject,
// 				text,
// 				html,
// 				attachments: attachments.map((attachment) => ({
// 					filename: attachment.filename,
// 					content: toBase64(attachment.content),
// 				})),
// 			}),
// 		});

// 		const result = await response.json();
// 		if (!response.ok) throw new Error(result.message || `Resend request failed with status ${response.status}`);
// 		return { messageId: result.id };
// 	},
// };

// module.exports = emailTransporter;

// ---------------------------------------USE THE BELOW CODE TO GET MAILS BY RUNNING IT LOCALLY----------------------------------------------------------------------------------

const nodemailer = require('nodemailer');

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