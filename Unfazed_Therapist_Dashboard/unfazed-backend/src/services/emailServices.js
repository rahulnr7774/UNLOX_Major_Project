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
	const hasResend = process.env.RESEND_API_KEY || process.env.RESEND_REST_API_KEY;
	const hasSmtp = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
	if (!hasResend && !hasSmtp) {
		console.error('[email] missing RESEND_API_KEY or SMTP credentials');
		throw new Error('RESEND_API_KEY or SMTP credentials must be configured');
	}

	console.log(`[email] sending to ${to}: ${subject}`);

	try {
		const result = await emailTransporter.sendMail({
			from: process.env.RESEND_FROM_EMAIL || (process.env.EMAIL_USER ? `Unfazed <${process.env.EMAIL_USER}>` : 'Unfazed <onboarding@resend.dev>'),
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
		html: `
			<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
				<div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
					<h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Unfazed</h1>
					<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Mental Health Journey Starts Here</p>
				</div>
				<div style="background-color: #f8f9fa; padding: 30px 20px; border-radius: 0 0 8px 8px;">
					<p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${safeClientName},</p>
					<p style="color: #555; font-size: 16px; line-height: 1.6;">${safeTherapistName} has approved your access to the Unfazed client portal.</p>
					<div style="background-color: white; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 4px;">
						<p style="color: #666; font-size: 14px; margin: 8px 0;"><strong>📧 Email:</strong> ${escapeHtml(recipient)}</p>
						<p style="color: #666; font-size: 14px; margin: 8px 0;"><strong>🔐 Temporary Password:</strong> <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 3px;">${escapeHtml(password)}</code></p>
					</div>
					<div style="text-align: center; margin: 30px 0;">
						<a href="${safeLoginUrl}" style="background-color: #007bff; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">Open Your Portal</a>
					</div>
					<p style="color: #d9534f; font-size: 14px; background: #fff5f5; padding: 12px; border-radius: 4px; margin: 20px 0;">⚠️ Please change your password immediately after signing in for security.</p>
					<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
					<p style="color: #999; font-size: 12px; text-align: center;">If you didn't request this access, please contact us immediately.</p>
					<p style="color: #999; font-size: 12px; text-align: center;">© Unfazed 2026. All rights reserved.</p>
				</div>
			</div>
		`
	});
}

async function sendClientApprovalNotification({ recipient, clientName, therapistName, loginUrl }) {
	console.log(`[email] preparing client approval email for ${recipient}`);
	const safeClientName = escapeHtml(clientName || 'there');
	const safeTherapistName = escapeHtml(therapistName || 'your therapist');
	const safeRecipient = escapeHtml(recipient);
	const safeLoginUrl = escapeHtml(loginUrl);

	return sendEmail({
		to: recipient,
		subject: 'Your Unfazed client access has been approved',
		text: `Hi ${clientName || 'there'},\n\n${therapistName || 'Your therapist'} has approved your request to access the Unfazed client portal.\n\nSign in with your registered credentials:\nEmail: ${recipient}\n\nOpen the portal: ${loginUrl}`,
		html: `
			<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
				<div style="background: #1f6f5b; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
					<h1 style="color: white; margin: 0; font-size: 28px;">Access approved</h1>
					<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Unfazed client portal is ready.</p>
				</div>
				<div style="background-color: #f8f9fa; padding: 30px 20px; border-radius: 0 0 8px 8px;">
					<p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${safeClientName},</p>
					<p style="color: #555; font-size: 16px; line-height: 1.6;">${safeTherapistName} approved your request to access the Unfazed client portal.</p>
					<div style="background-color: white; border-left: 4px solid #1f6f5b; padding: 15px; margin: 20px 0; border-radius: 4px;">
						<p style="color: #666; font-size: 14px; margin: 8px 0;"><strong>Email:</strong> ${safeRecipient}</p>
						<p style="color: #666; font-size: 14px; margin: 8px 0;">Use the password you created when signing up.</p>
					</div>
					<div style="text-align: center; margin: 30px 0;">
						<a href="${safeLoginUrl}" style="background-color: #1f6f5b; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">Sign in to your portal</a>
					</div>
					<p style="color: #999; font-size: 12px; text-align: center;">If you did not request this access, please contact your therapist.</p>
				</div>
			</div>
		`
	});
}

function formatInvoiceDate(value) {
	if (!value) return '';
	return new Date(value).toLocaleDateString('en-IN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

function calculateInvoiceTotal(data) {
	let total = Number(data.subtotal || data.amount || 0);
	['cgst', 'sgst', 'igst', 'tax'].forEach((key) => {
		total += Number(data[key] || 0);
	});
	return total - Number(data.discount || 0);
}

function createInvoiceHtml(data) {
	const currency = data.currency === 'INR' ? '₹' : data.currency || '₹';
	const items = data.lineItems || [{
		description: data.description || 'Professional Services',
		quantity: data.quantity || 1,
		rate: data.subtotal || data.amount || 0
	}];
	const total = calculateInvoiceTotal(data);
	const itemRows = items.map((item) => `
		<tr>
			<td>${escapeHtml(item.description)}</td>
			<td class="center">${escapeHtml(item.quantity)}</td>
			<td class="money">${currency}${Number(item.rate || 0).toFixed(2)}</td>
			<td class="money">${currency}${(Number(item.quantity || 0) * Number(item.rate || 0)).toFixed(2)}</td>
		</tr>
	`).join('');

	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Invoice ${escapeHtml(data.invoiceNumber)}</title>
	<style>
		body { margin: 0; padding: 32px 16px; background: #eef3f8; color: #263238; font-family: Arial, sans-serif; }
		.invoice { max-width: 760px; margin: 0 auto; background: #fff; border: 1px solid #dce3ea; }
		.header { padding: 32px 40px 24px; border-bottom: 4px solid #1677c8; }
		.brand { margin: 0; color: #102a43; font-size: 28px; letter-spacing: 1px; }
		.title { margin: 8px 0 0; color: #1677c8; font-size: 18px; }
		.meta, .parties { display: flex; justify-content: space-between; gap: 24px; }
		.meta { margin-top: 22px; color: #52606d; font-size: 13px; }
		.status { color: #16803c; font-weight: bold; text-transform: uppercase; }
		.content { padding: 28px 40px 36px; }
		.parties { margin-bottom: 28px; }
		.party { width: 50%; }
		.label { margin: 0 0 8px; color: #829ab1; font-size: 11px; font-weight: bold; letter-spacing: 1px; }
		.party p { margin: 4px 0; font-size: 13px; }
		table { width: 100%; border-collapse: collapse; font-size: 13px; }
		th { padding: 11px 10px; background: #eaf2f9; color: #334e68; text-align: left; }
		td { padding: 13px 10px; border-bottom: 1px solid #e6edf3; }
		.center { text-align: center; }
		.money { text-align: right; white-space: nowrap; }
		.totals { width: 300px; margin: 24px 0 0 auto; font-size: 13px; }
		.total-row { display: flex; justify-content: space-between; padding: 7px 0; }
		.total { margin-top: 6px; border-top: 2px solid #1677c8; color: #1677c8; font-size: 17px; font-weight: bold; }
		.notes { margin-top: 34px; padding-top: 18px; border-top: 1px solid #dce3ea; color: #52606d; font-size: 12px; }
		@media (max-width: 600px) { .header, .content { padding-left: 20px; padding-right: 20px; } .meta, .parties { display: block; } .party { width: 100%; margin-bottom: 18px; } .totals { width: 100%; } }
	</style>
</head>
<body>
	<main class="invoice">
		<header class="header">
			<h1 class="brand">${escapeHtml(data.companyName || 'UNFAZED')}</h1>
			<p class="title">INVOICE</p>
			<div class="meta">
				<div>Invoice #: <strong>${escapeHtml(data.invoiceNumber)}</strong><br>Date: ${formatInvoiceDate(data.invoiceDate)}<br>Due Date: ${formatInvoiceDate(data.dueDate)}</div>
				<div class="status">${escapeHtml(data.status || 'Pending')}</div>
			</div>
		</header>
		<section class="content">
			<div class="parties">
				<div class="party"><p class="label">FROM</p><p><strong>${escapeHtml(data.companyName || 'Unfazed')}</strong></p><p>${escapeHtml(data.companyAddress)}</p><p>${escapeHtml(data.companyCity)}</p><p>${escapeHtml(data.companyEmail)}</p></div>
				<div class="party"><p class="label">BILL TO</p><p><strong>${escapeHtml(data.clientName)}</strong></p><p>${escapeHtml(data.clientEmail)}</p><p>${escapeHtml(data.clientPhone)}</p><p>${escapeHtml(data.clientAddress)}</p></div>
			</div>
			<table><thead><tr><th>Description</th><th class="center">Qty</th><th class="money">Rate</th><th class="money">Amount</th></tr></thead><tbody>${itemRows}</tbody></table>
			<div class="totals">
				<div class="total-row"><span>Subtotal</span><span>${currency}${Number(data.subtotal || data.amount || 0).toFixed(2)}</span></div>
				${Number(data.cgst) ? `<div class="total-row"><span>CGST</span><span>${currency}${Number(data.cgst).toFixed(2)}</span></div>` : ''}
				${Number(data.sgst) ? `<div class="total-row"><span>SGST</span><span>${currency}${Number(data.sgst).toFixed(2)}</span></div>` : ''}
				${Number(data.igst) ? `<div class="total-row"><span>IGST</span><span>${currency}${Number(data.igst).toFixed(2)}</span></div>` : ''}
				${Number(data.discount) ? `<div class="total-row"><span>Discount</span><span>-${currency}${Number(data.discount).toFixed(2)}</span></div>` : ''}
				<div class="total-row total"><span>TOTAL</span><span>${currency}${total.toFixed(2)}</span></div>
			</div>
			<div class="notes"><strong>Notes</strong><br>${escapeHtml(data.notes || 'Thank you for choosing Unfazed!')}</div>
		</section>
	</main>
</body>
</html>`;
}

async function sendInvoice({ recipient, invoiceData }) {
	console.log(`[email] preparing invoice email for ${recipient}`);
	const invoiceHtml = createInvoiceHtml(invoiceData);
	const invoiceAmount = calculateInvoiceTotal(invoiceData).toFixed(2);
	const dueDate = formatInvoiceDate(invoiceData.dueDate);

	return sendEmail({
		to: recipient,
		subject: `Invoice #${invoiceData.invoiceNumber} from Unfazed - ₹${invoiceAmount}`,
		text: `Invoice #${invoiceData.invoiceNumber}\nAmount Due: ₹${invoiceAmount}\nDue Date: ${dueDate}\n\nThe complete invoice is attached as an HTML file.`,
		html: invoiceHtml,
		attachments: [{
			filename: `invoice_${invoiceData.invoiceNumber}.html`,
			content: invoiceHtml,
			contentType: 'text/html'
		}]
	});
}

module.exports = { sendEmail, sendClientLoginAccess, sendClientApprovalNotification, sendInvoice };