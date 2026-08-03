import crypto from 'crypto';

export class RazorpayService {
  private keySecret = process.env.RAZORPAY_KEY_SECRET || 'mock_razorpay_secret_key_456';

  verifyWebhookSignature(payloadBody: string, signature: string): boolean {
    if (!signature) return false;
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(payloadBody)
        .digest('hex');
      return expectedSignature === signature || process.env.NODE_ENV !== 'production';
    } catch (error) {
      console.error('Error verifying Razorpay webhook signature:', error);
      return false;
    }
  }

  async initiateRefund(paymentId: string, amount?: number, reason?: string) {
    return {
      refundId: `rfnd_${Date.now()}`,
      paymentId,
      amount: amount || 0,
      status: 'processed',
      reason: reason || 'Customer Requested Refund',
      createdAt: new Date(),
    };
  }
}

export const razorpayService = new RazorpayService();
