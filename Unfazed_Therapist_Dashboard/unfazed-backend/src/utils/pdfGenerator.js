const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class InvoicePDFGenerator {
	constructor() {
		this.pageWidth = 612;
		this.pageHeight = 792;
		this.margin = 40;
		this.contentWidth = this.pageWidth - this.margin * 2;
	}

	generateInvoice(invoiceData) {
		return new Promise((resolve, reject) => {
			try {
				const doc = new PDFDocument({
					size: 'LETTER',
					margin: this.margin
				});

				const filename = `invoice_${invoiceData.invoiceNumber}_${Date.now()}.pdf`;
				const filepath = path.join(__dirname, '../temp', filename);

				// Ensure temp directory exists
				if (!fs.existsSync(path.dirname(filepath))) {
					fs.mkdirSync(path.dirname(filepath), { recursive: true });
				}

				const stream = fs.createWriteStream(filepath);
				doc.pipe(stream);

				// Generate PDF content
				this._addHeader(doc, invoiceData);
				this._addInvoiceDetails(doc, invoiceData);
				this._addBillingInfo(doc, invoiceData);
				this._addLineItems(doc, invoiceData);
				this._addTotals(doc, invoiceData);
				this._addFooter(doc, invoiceData);

				doc.end();

				stream.on('finish', () => {
					resolve(filepath);
				});

				stream.on('error', reject);
				doc.on('error', reject);
			} catch (error) {
				reject(error);
			}
		});
	}

	_addHeader(doc, data) {
		doc.fontSize(24)
			.font('Helvetica-Bold')
			.fillColor('#102a43')
			.text(data.companyName || 'UNFAZED', this.margin, this.margin);

		doc.strokeColor('#1677c8')
			.lineWidth(4)
			.moveTo(this.margin, 70)
			.lineTo(this.pageWidth - this.margin, 70)
			.stroke();

		doc.fontSize(14)
			.font('Helvetica-Bold')
			.fillColor('#1677c8')
			.text('INVOICE', this.margin, 85);

		doc.fontSize(10)
			.font('Helvetica')
			.fillColor('#555555')
			.text(`Invoice #: ${data.invoiceNumber}`, this.margin, 110)
			.text(`Date: ${this._formatDate(data.invoiceDate)}`, this.margin, 125)
			.text(`Due Date: ${this._formatDate(data.dueDate)}`, this.margin, 140);

		if (data.status) {
			const statusColor = data.status.toLowerCase() === 'paid' ? '#16803c' : '#c05621';
			doc.fontSize(10)
				.font('Helvetica-Bold')
				.fillColor(statusColor)
				.text(data.status.toUpperCase(), this.pageWidth - this.margin - 100, 110);
		}

		// GST/Tax ID if available
		if (data.gstNumber) {
			doc.fontSize(9)
				.font('Helvetica')
				.fillColor('#666666')
				.text(`GST ID: ${data.gstNumber}`, this.margin, 155);
		}
	}

	_addInvoiceDetails(doc, data) {
		const leftX = this.margin;
		const rightX = this.pageWidth / 2 + 20;
		const startY = 180;

		// From section
		doc.fontSize(11)
			.font('Helvetica-Bold')
			.fillColor('#829ab1')
			.text('FROM', leftX, startY);

		doc.fontSize(10)
			.font('Helvetica')
			.fillColor('#52606d')
			.text(data.companyName || 'Unfazed', leftX, startY + 20)
			.text(data.companyAddress || '', leftX, startY + 35)
			.text(data.companyCity || '', leftX, startY + 50)
			.text(data.companyPhone || '', leftX, startY + 65)
			.text(data.companyEmail || '', leftX, startY + 80);

		// Bill To section
		doc.fontSize(11)
			.font('Helvetica-Bold')
			.fillColor('#829ab1')
			.text('BILL TO', rightX, startY);

		doc.fontSize(10)
			.font('Helvetica')
			.fillColor('#52606d')
			.text(data.clientName || '', rightX, startY + 20)
			.text(data.clientEmail || '', rightX, startY + 35)
			.text(data.clientPhone || '', rightX, startY + 50)
			.text(data.clientAddress || '', rightX, startY + 65)
			.text(data.clientCity || '', rightX, startY + 80);
	}

	_addBillingInfo(doc, data) {
		const startY = 300;

		doc.fontSize(10)
			.font('Helvetica-Bold')
			.fillColor('#829ab1')
			.text('SERVICE DETAILS', this.margin, startY);

		doc.fontSize(9)
			.font('Helvetica')
			.fillColor('#52606d')
			.text(`Description: ${data.description || 'Professional Services'}`, this.margin, startY + 20)
			.text(`Issued Date: ${this._formatDate(data.invoiceDate)}`, this.margin, startY + 35);

		if (data.therapistName) {
			doc.text(`Therapist: ${data.therapistName}`, this.margin, startY + 50);
		}

		if (data.currency) {
			doc.text(`Currency: ${data.currency}`, this.margin, startY + 65);
		}
	}

	_addLineItems(doc, data) {
		const startY = 365;
		const colWidths = {
			description: 280,
			quantity: 50,
			rate: 80,
			amount: 80
		};

		doc.fillColor('#eaf2f9')
			.rect(this.margin, startY, this.contentWidth, 25)
			.fill();

		doc.fontSize(10)
			.font('Helvetica-Bold')
			.fillColor('#334e68')
			.text('Description', this.margin + 10, startY + 7, { width: colWidths.description })
			.text('Qty', this.margin + colWidths.description + 10, startY + 7, { width: colWidths.quantity, align: 'center' })
			.text('Rate', this.margin + colWidths.description + colWidths.quantity + 10, startY + 7, { width: colWidths.rate, align: 'right' })
			.text('Amount', this.margin + colWidths.description + colWidths.quantity + colWidths.rate + 10, startY + 7, { width: colWidths.amount, align: 'right' });

		// Line items
		let currentY = startY + 30;
		const items = data.lineItems || [
			{
				description: data.description || 'Professional Services',
				quantity: data.quantity || 1,
				rate: data.subtotal || data.amount || 0
			}
		];

		doc.fontSize(9).font('Helvetica').fillColor('#52606d');

		items.forEach((item) => {
			if (currentY > this.pageHeight - 180) {
				doc.addPage();
				currentY = this.margin;
			}

			const amount = (item.quantity * item.rate).toFixed(2);

				doc.text(item.description || 'Professional Services', this.margin + 10, currentY, { width: colWidths.description })
				.text(item.quantity.toString(), this.margin + colWidths.description + 10, currentY, { width: colWidths.quantity, align: 'center' })
				.text(`INR ${parseFloat(item.rate || 0).toFixed(2)}`, this.margin + colWidths.description + colWidths.quantity + 10, currentY, { width: colWidths.rate, align: 'right' })
				.text(`INR ${amount}`, this.margin + colWidths.description + colWidths.quantity + colWidths.rate + 10, currentY, { width: colWidths.amount, align: 'right' });

			currentY += 25;
		});

		this.lastLineY = currentY;
	}

	_addTotals(doc, data) {
		const rightX = this.pageWidth - this.margin - 180;
		let startY = this.lastLineY + 20;
		const minimumTotalsY = this.pageHeight - this.margin - 170;

		if (startY > minimumTotalsY) {
			doc.addPage();
			startY = this.margin;
		}

		doc.fontSize(10)
			.font('Helvetica')
			.fillColor('#555555')
			.text('Subtotal:', rightX, startY, { width: 120, align: 'right' })
			.text(`INR ${parseFloat(data.subtotal || data.amount || 0).toFixed(2)}`, rightX + 130, startY, { width: 50, align: 'right' });

		startY += 25;

		// CGST (Central GST - 9%)
		if (data.cgst && parseFloat(data.cgst) > 0) {
			doc.text('CGST (9%):', rightX, startY, { width: 120, align: 'right' })
				.text(`INR ${parseFloat(data.cgst).toFixed(2)}`, rightX + 130, startY, { width: 50, align: 'right' });
			startY += 25;
		}

		// SGST (State GST - 9%)
		if (data.sgst && parseFloat(data.sgst) > 0) {
			doc.text('SGST (9%):', rightX, startY, { width: 120, align: 'right' })
				.text(`INR ${parseFloat(data.sgst).toFixed(2)}`, rightX + 130, startY, { width: 50, align: 'right' });
			startY += 25;
		}

		// IGST (Integrated GST - 18%) if applicable
		if (data.igst && parseFloat(data.igst) > 0) {
			doc.text('IGST (18%):', rightX, startY, { width: 120, align: 'right' })
				.text(`INR ${parseFloat(data.igst).toFixed(2)}`, rightX + 130, startY, { width: 50, align: 'right' });
			startY += 25;
		}

		// Discount
		if (data.discount && parseFloat(data.discount) > 0) {
			doc.fillColor('#d9534f')
				.text('Discount:', rightX, startY, { width: 120, align: 'right' })
				.text(`-INR ${parseFloat(data.discount).toFixed(2)}`, rightX + 130, startY, { width: 50, align: 'right' });
			startY += 25;
		}

		// Total line
		doc.strokeColor('#000000')
			.lineWidth(2)
			.moveTo(rightX, startY)
			.lineTo(this.pageWidth - this.margin, startY)
			.stroke();

		startY += 12;

		const total = this._calculateTotal(data);

		doc.fontSize(12)
			.font('Helvetica-Bold')
			.fillColor('#1677c8')
			.text('TOTAL:', rightX, startY, { width: 120, align: 'right' })
			.text(`INR ${total.toFixed(2)}`, rightX + 130, startY, { width: 50, align: 'right' });

		// Payment status
		if (data.amountPaid && parseFloat(data.amountPaid) > 0) {
			startY += 35;
			doc.fontSize(10)
				.font('Helvetica')
				.fillColor('#52606d')
				.text('Amount Paid:', rightX, startY, { width: 120, align: 'right' })
				.text(`INR ${parseFloat(data.amountPaid).toFixed(2)}`, rightX + 130, startY, { width: 50, align: 'right' });

			const remaining = total - parseFloat(data.amountPaid);
			startY += 25;
			doc.font('Helvetica-Bold')
				.fillColor(remaining > 0 ? '#d9534f' : '#28a745')
				.text('Balance Due:', rightX, startY, { width: 120, align: 'right' })
				.text(`INR ${Math.max(0, remaining).toFixed(2)}`, rightX + 130, startY, { width: 50, align: 'right' });
		}
	}

	_addFooter(doc, data) {
		const footerY = this.pageHeight - this.margin - 65;

		doc.strokeColor('#cccccc')
			.lineWidth(0.5)
			.moveTo(this.margin, footerY)
			.lineTo(this.pageWidth - this.margin, footerY)
			.stroke();

		doc.fontSize(9)
			.font('Helvetica-Bold')
			.fillColor('#829ab1')
			.text('NOTES', this.margin, footerY + 15);

		doc.fontSize(9)
			.font('Helvetica')
			.fillColor('#52606d')
			.text(data.notes || 'Thank you for choosing Unfazed!', this.margin, footerY + 30, { width: this.contentWidth });

		doc.fontSize(8)
			.fillColor('#999999')
			.text(`Generated on ${this._formatDate(new Date())} | Invoice #${data.invoiceNumber}`, this.margin, this.pageHeight - this.margin - 15, { align: 'center', width: this.contentWidth });
	}

	_formatDate(date) {
		if (!date) return '';
		const d = new Date(date);
		return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
	}

	_calculateTotal(data) {
		let total = parseFloat(data.subtotal || data.amount || 0);
		if (data.cgst) total += parseFloat(data.cgst);
		if (data.sgst) total += parseFloat(data.sgst);
		if (data.igst) total += parseFloat(data.igst);
		if (data.tax) total += parseFloat(data.tax);
		if (data.discount) total -= parseFloat(data.discount);
		return total;
	}
}

module.exports = new InvoicePDFGenerator();