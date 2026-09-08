const emailTransporter = require('../utils/emailConfig');

function escapeHtml(value = '') {
	return String(value).replace(/[&<>'"]/g, (character) => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		"'": '&#39;',
		'"': '&quot;'
	})[character]);
}

async function sendEmail({ to, subject, text, html, attachments = [] }) {
	if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
		console.error('[email] missing EMAIL_USER or EMAIL_PASSWORD');
		throw new Error('EMAIL_USER and EMAIL_PASSWORD must be configured');
	}

	console.log(`[email] sending to ${to}: ${subject}`);

	try {
		const result = await emailTransporter.sendMail({
			from: `Unfazed <${process.env.EMAIL_USER}>`,
			to,
			subject,
			text,
			html,
			attachments
		});
		console.log(`[email] sent to ${to}; messageId=${result.messageId}`);
		return result;
	} catch (error) {
		console.error(`[email] failed for ${to}: ${error.message}`);
		throw error;
	}
}

async function sendClientLoginAccess({ recipient, clientName, therapistName, loginUrl, password }) {
	console.log(`[email] preparing client access email for ${recipient}`);
	const safeClientName = escapeHtml(clientName || 'there');
	const safeTherapistName = escapeHtml(therapistName || 'your therapist');
	const safeLoginUrl = escapeHtml(loginUrl);

	return sendEmail({
		to: recipient,
		subject: 'Your Unfazed client portal access',
		text: `Hi ${clientName || 'there'},\n\n${therapistName || 'Your therapist'} has approved your Unfazed client portal access.\n\nEmail: ${recipient}\nPassword: ${password}\n\nAccess the portal: ${loginUrl}`,
		html: `<p>Hi ${safeClientName},</p><p>${safeTherapistName} approved your Unfazed client portal access.</p><p><strong>Email:</strong> ${escapeHtml(recipient)}<br><strong>Temporary password:</strong> ${escapeHtml(password)}</p><p><a href="${safeLoginUrl}">Open your client portal</a></p><p>Please change this password after signing in.</p>`
	});
}

module.exports = { sendEmail, sendClientLoginAccess };
