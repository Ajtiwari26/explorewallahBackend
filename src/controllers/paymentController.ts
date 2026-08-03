import { Request, Response } from 'express';
import { FilterQuery } from 'mongoose';
import Payment, { IPayment } from '../models/Payment';
import { razorpayService } from '../services/razorpayService';
import { AuthRequest } from '../middleware/authMiddleware';

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const filter: FilterQuery<IPayment> = {};

    if (status) filter.status = status as any;
    if (search) {
      filter.$or = [
        { razorpayOrderId: { $regex: search as string, $options: 'i' } },
        { razorpayPaymentId: { $regex: search as string, $options: 'i' } },
        { customerName: { $regex: search as string, $options: 'i' } },
        { customerEmail: { $regex: search as string, $options: 'i' } },
      ];
    }

    const payments = await Payment.find(filter).sort({ createdAt: -1 });
    res.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

/**
 * Get Razorpay Config
 */
export const getPaymentConfig = async (req: Request, res: Response): Promise<void> => {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_IOk2tHMSQHhGzI';
  res.json({
    razorpay_key_id: keyId,
    currency: 'INR',
  });
};

/**
 * Create Razorpay Order via Razorpay REST API
 */
export const createRazorpayOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, order_id, notes } = req.body;
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_IOk2tHMSQHhGzI';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'n4ew6QXZwLhK1xLfF2j4XiCT';
    const bypass = process.env.BYPASS_RAZORPAY === 'true';

    if (bypass) {
      res.json({
        razorpay_order_id: `order_dev_${order_id || Date.now()}`,
        amount: Math.round(amount * 100),
        currency: 'INR',
        key_id: keyId,
        bypass: true,
      });
      return;
    }

    const amountPaise = Math.round(amount * 100);
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const razorpayData = {
      amount: amountPaise,
      currency: 'INR',
      receipt: order_id || `receipt_${Date.now()}`,
      notes: notes || {},
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(razorpayData),
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      console.error('[Razorpay API Error]:', data);
      res.status(response.status).json({ error: 'Razorpay order creation failed', detail: data });
      return;
    }

    res.json({
      razorpay_order_id: data.id,
      amount: amountPaise,
      currency: 'INR',
      key_id: keyId,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
};

/**
 * Verify Razorpay Payment Signature
 */
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

    if (razorpay_order_id?.startsWith('order_dev_')) {
      res.json({
        success: true,
        message: 'Payment verified (dev bypass)',
        order_id,
        payment_id: `pay_dev_${Date.now()}`,
      });
      return;
    }

    const isValid = razorpayService.verifyWebhookSignature(
      `${razorpay_order_id}|${razorpay_payment_id}`,
      razorpay_signature
    );

    if (!isValid) {
      res.status(400).json({ error: 'Invalid Razorpay payment signature' });
      return;
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      order_id,
      payment_id: razorpay_payment_id,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

export const initiateRefund = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      res.status(404).json({ error: 'Payment record not found' });
      return;
    }

    const refund = await razorpayService.initiateRefund(
      payment.razorpayPaymentId || payment.razorpayOrderId,
      amount,
      reason
    );

    payment.status = 'REFUNDED';
    await payment.save();

    res.json({ message: 'Refund initiated successfully', refund, payment });
  } catch (error) {
    console.error('Error initiating refund:', error);
    res.status(500).json({ error: 'Failed to initiate refund' });
  }
};
