import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface IInvoicePdfParams {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  gstin?: string;
  packageTitle: string;
  batchStartDate: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

export class PdfInvoiceService {
  async generateInvoicePdf(params: IInvoicePdfParams, outputFilePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const dir = path.dirname(outputFilePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const doc = new PDFDocument({ margin: 50 });
        const writeStream = fs.createWriteStream(outputFilePath);

        doc.pipe(writeStream);

        // Header
        doc
          .fillColor('#064E3B')
          .fontSize(24)
          .text('EXPLORE WALLAH', 50, 50)
          .fontSize(10)
          .fillColor('#4B5563')
          .text('Premium Travel & Adventure Platform', 50, 78)
          .text('GSTIN: 07AAAAA0000A1Z5 | Support: hello@explorewallah.com', 50, 92);

        doc
          .fontSize(18)
          .fillColor('#111827')
          .text('TAX INVOICE', 400, 50, { align: 'right' })
          .fontSize(10)
          .fillColor('#6B7280')
          .text(`Invoice No: ${params.invoiceNumber}`, 400, 75, { align: 'right' })
          .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 400, 90, { align: 'right' });

        doc.moveDown(2);
        doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, 115).lineTo(550, 115).stroke();

        // Customer Details
        doc
          .fontSize(12)
          .fillColor('#1F2937')
          .text('Billed To:', 50, 135)
          .fontSize(10)
          .fillColor('#4B5563')
          .text(`Customer Name: ${params.customerName}`, 50, 155)
          .text(`Email: ${params.customerEmail}`, 50, 170)
          .text(`Phone: ${params.customerPhone}`, 50, 185)
          .text(`GSTIN: ${params.gstin || 'Unregistered'}`, 50, 200);

        // Line Items Table Header
        const tableTop = 235;
        doc
          .fillColor('#064E3B')
          .rect(50, tableTop, 500, 25)
          .fill();

        doc
          .fillColor('#FFFFFF')
          .fontSize(10)
          .text('Description / Service', 60, tableTop + 7)
          .text('Batch Date', 280, tableTop + 7)
          .text('SAC Code', 380, tableTop + 7)
          .text('Amount (INR)', 470, tableTop + 7, { align: 'right' });

        // Table Content
        const itemY = tableTop + 35;
        doc
          .fillColor('#1F2937')
          .text(params.packageTitle, 60, itemY)
          .text(params.batchStartDate, 280, itemY)
          .text('998551', 380, itemY)
          .text(`₹${params.subtotal.toLocaleString('en-IN')}`, 470, itemY, { align: 'right' });

        // Total Calculations Box
        const summaryY = itemY + 40;
        doc.strokeColor('#E5E7EB').moveTo(50, summaryY).lineTo(550, summaryY).stroke();

        doc
          .fontSize(10)
          .fillColor('#4B5563')
          .text('Subtotal:', 350, summaryY + 15)
          .text(`₹${params.subtotal.toLocaleString('en-IN')}`, 470, summaryY + 15, { align: 'right' })
          .text('CGST (9%):', 350, summaryY + 30)
          .text(`₹${params.cgst.toLocaleString('en-IN')}`, 470, summaryY + 30, { align: 'right' })
          .text('SGST (9%):', 350, summaryY + 45)
          .text(`₹${params.sgst.toLocaleString('en-IN')}`, 470, summaryY + 45, { align: 'right' });

        doc.strokeColor('#064E3B').lineWidth(1.5).moveTo(350, summaryY + 65).lineTo(550, summaryY + 65).stroke();

        doc
          .fontSize(12)
          .fillColor('#064E3B')
          .text('Total Amount Paid:', 350, summaryY + 75)
          .text(`₹${params.totalAmount.toLocaleString('en-IN')}`, 470, summaryY + 75, { align: 'right' });

        // Footer
        doc
          .fontSize(9)
          .fillColor('#9CA3AF')
          .text('Thank you for booking your adventure with Explore Wallah! Safe Travels.', 50, 700, { align: 'center' });

        doc.end();

        writeStream.on('finish', () => {
          resolve(outputFilePath);
        });

        writeStream.on('error', (err) => {
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const pdfInvoiceService = new PdfInvoiceService();
