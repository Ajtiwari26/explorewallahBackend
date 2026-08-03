import { Request, Response } from 'express';
import Payment from '../models/Payment';
import Invoice from '../models/Invoice';
import WhatsAppChat from '../models/WhatsAppChat';
import WhatsAppMessage from '../models/WhatsAppMessage';
import SystemSetting from '../models/SystemSetting';
import { razorpayService } from '../services/razorpayService';
import { geminiAiService } from '../services/geminiAiService';
import { pdfInvoiceService } from '../services/pdfInvoiceService';
import path from 'path';

export const handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      res.status(400).json({ error: 'Invalid webhook signature' });
      return;
    }

    const { event, payload } = req.body;

    if (event === 'payment.captured' && payload?.payment?.entity) {
      const paymentEntity = payload.payment.entity;

      let payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id });
      if (!payment) {
        payment = new Payment({
          razorpayOrderId: paymentEntity.order_id,
          razorpayPaymentId: paymentEntity.id,
          amount: paymentEntity.amount / 100,
          currency: paymentEntity.currency,
          status: 'CAPTURED',
          paymentMethod: paymentEntity.method,
          customerName: paymentEntity.email || 'Valued Customer',
          customerEmail: paymentEntity.email || 'customer@explorewallah.com',
          customerPhone: paymentEntity.contact || '+910000000000',
          rawPayload: paymentEntity,
        });
      } else {
        payment.status = 'CAPTURED';
        payment.razorpayPaymentId = paymentEntity.id;
      }
      await payment.save();

      // Automated GST Invoice Trigger
      const invCount = await Invoice.countDocuments();
      const invoiceNumber = `EW-2026-${String(invCount + 1).padStart(4, '0')}`;
      const subtotal = Math.round((payment.amount / 1.18) * 100) / 100;
      const cgst = Math.round((subtotal * 0.09) * 100) / 100;
      const sgst = Math.round((subtotal * 0.09) * 100) / 100;

      const pdfPath = path.join(process.cwd(), `uploads/invoices/${invoiceNumber}.pdf`);

      await pdfInvoiceService.generateInvoicePdf(
        {
          invoiceNumber,
          customerName: payment.customerName,
          customerEmail: payment.customerEmail,
          customerPhone: payment.customerPhone,
          packageTitle: 'Trek & Adventure Batch Booking',
          batchStartDate: new Date().toLocaleDateString('en-IN'),
          subtotal,
          cgst,
          sgst,
          igst: 0,
          totalAmount: payment.amount,
        },
        pdfPath
      );

      await Invoice.create({
        invoiceNumber,
        paymentId: payment._id,
        customerName: payment.customerName,
        customerEmail: payment.customerEmail,
        customerPhone: payment.customerPhone,
        packageTitle: 'Trek & Adventure Batch Booking',
        amount: payment.amount,
        subtotal,
        cgst,
        sgst,
        igst: 0,
        totalAmount: payment.amount,
        pdfUrl: `/uploads/invoices/${invoiceNumber}.pdf`,
        status: 'PAID',
        dueDate: new Date(),
      });
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Error handling Razorpay webhook:', error);
    res.status(500).json({ error: 'Webhook processing error' });
  }
};

/**
 * Verify Meta WhatsApp Webhook Callback URL (GET /api/webhooks/whatsapp)
 */
export const verifyWhatsAppWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'iqsl_whatsapp_verify_token_2026';
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('[WhatsApp Webhook] Verified successfully!');
        res.status(200).send(challenge);
        return;
      } else {
        console.warn('[WhatsApp Webhook] Verification failed. Token mismatch.');
        res.status(403).send('Forbidden');
        return;
      }
    }
    res.status(400).send('Bad Request');
  } catch (error) {
    console.error('[WhatsApp Webhook] Error during verification:', error);
    res.status(500).send('Internal Server Error');
  }
};

/**
 * Receive WhatsApp Event Notifications (POST /api/webhooks/whatsapp)
 */
export const handleWhatsAppWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, messageText } = req.body;

    if (!from || !messageText) {
      res.status(400).json({ error: 'from and messageText are required' });
      return;
    }

    let chat = await WhatsAppChat.findOne({ customerPhone: from });
    if (!chat) {
      const globalSetting = await SystemSetting.findOne({ key: 'whatsapp_global_mode' });
      const initialMode = (globalSetting ? globalSetting.value.mode : 'AI') as 'HUMAN' | 'AI';

      chat = await WhatsAppChat.create({
        customerPhone: from,
        currentMode: initialMode,
        lastMessage: messageText,
        lastMessageAt: new Date(),
        unreadCount: 1,
      });
    } else {
      chat.lastMessage = messageText;
      chat.lastMessageAt = new Date();
      chat.unreadCount += 1;
      await chat.save();
    }

    await WhatsAppMessage.create({
      chatId: chat._id,
      senderType: 'CUSTOMER',
      messageText,
      messageStatus: 'DELIVERED',
    });

    if (chat.currentMode === 'AI') {
      const aiReply = await geminiAiService.generateResponseForWhatsApp(messageText);

      await WhatsAppMessage.create({
        chatId: chat._id,
        senderType: 'GEMINI_AI',
        messageText: aiReply,
        messageStatus: 'SENT',
      });

      chat.lastMessage = `[AI Response]: ${aiReply.substring(0, 40)}...`;
      chat.lastMessageAt = new Date();
      await chat.save();

      res.json({ status: 'ok', mode: 'AI', aiResponse: aiReply });
      return;
    }

    res.json({ status: 'ok', mode: 'HUMAN', note: 'Message routed to Admin Portal Live Desk' });
  } catch (error) {
    console.error('Error handling WhatsApp webhook:', error);
    res.status(200).send('EVENT_RECEIVED');
  }
};
