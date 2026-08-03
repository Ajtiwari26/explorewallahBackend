import { Response } from 'express';
import { FilterQuery } from 'mongoose';
import Payment, { IPayment } from '../models/Payment';
import { razorpayService } from '../services/razorpayService';
import { AuthRequest } from '../middleware/authMiddleware';

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const filter: FilterQuery<IPayment> = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { razorpayOrderId: { $regex: search, $options: 'i' } },
        { razorpayPaymentId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const payments = await Payment.find(filter).sort({ createdAt: -1 });
    res.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
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
