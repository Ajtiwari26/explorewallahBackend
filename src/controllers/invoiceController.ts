import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import Invoice from '../models/Invoice';
import { pdfInvoiceService } from '../services/pdfInvoiceService';
import { AuthRequest } from '../middleware/authMiddleware';

export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

export const downloadInvoicePdf = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const pdfDir = path.join(process.cwd(), 'uploads/invoices');
    const pdfPath = path.join(pdfDir, `${invoice.invoiceNumber}.pdf`);

    // Regenerate if not exists
    if (!fs.existsSync(pdfPath)) {
      await pdfInvoiceService.generateInvoicePdf(
        {
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          customerEmail: invoice.customerEmail,
          customerPhone: invoice.customerPhone || '+910000000000',
          gstin: 'Unregistered',
          packageTitle: invoice.packageTitle || 'Trek & Adventure Package',
          batchStartDate: new Date().toLocaleDateString('en-IN'),
          subtotal: invoice.subtotal || invoice.amount || 1000,
          cgst: invoice.cgst || 0,
          sgst: invoice.sgst || 0,
          igst: invoice.igst || 0,
          totalAmount: invoice.totalAmount || invoice.amount || 1000,
        },
        pdfPath
      );
    }

    res.download(pdfPath, `${invoice.invoiceNumber}.pdf`);
  } catch (error) {
    console.error('Error downloading invoice PDF:', error);
    res.status(500).json({ error: 'Failed to download PDF' });
  }
};
