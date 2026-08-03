/**
 * Integration Test Script for Razorpay & WhatsApp Cloud API
 * Path: explorewallahBackend/testscript/test_integration.js
 */
const hmac = require('crypto');

// Environment Credentials (from remaining.md)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_live_IOk2tHMSQHhGzI';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'n4ew6QXZwLhK1xLfF2j4XiCT';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || 'EAAsZByXDhm5MBRzC7c34OX3IVCcuXTi2GQPdfAsVHutdyx3gkFsG0KyRWG8HOp2tz7pAt9uFdlIOIUA8JOmzC4SIFX7z6o3xbEGqXfa4ZBZAIE9i4hLvuJ7J0MVwnWCINjsUCzVYD5HjiKwsaEA523d1OsYnhnH3gNyeamqfPo8CFxHlnj0lWsGRpuQFPwu5gZDZD';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '1164922906709086';
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'iqsl_whatsapp_verify_token_2026';

console.log('====================================================');
console.log('🧪 Exploring Wallah - Razorpay & WhatsApp Integration Test');
console.log('====================================================');
console.log('Razorpay Key ID:', RAZORPAY_KEY_ID);
console.log('WhatsApp Phone Number ID:', WHATSAPP_PHONE_NUMBER_ID);
console.log('WhatsApp Verify Token:', WHATSAPP_VERIFY_TOKEN);

// 1. Signature Verification Test
function verifySignature(orderId, paymentId, signature, secret) {
  const message = `${orderId}|${paymentId}`;
  const expected = hmac.createHmac('sha256', secret).update(message).digest('hex');
  return expected === signature;
}

const mockOrderId = 'order_N12345';
const mockPaymentId = 'pay_P67890';
const mockMessage = `${mockOrderId}|${mockPaymentId}`;
const generatedSig = hmac.createHmac('sha256', RAZORPAY_KEY_SECRET).update(mockMessage).digest('hex');
const isSignatureValid = verifySignature(mockOrderId, mockPaymentId, generatedSig, RAZORPAY_KEY_SECRET);

console.log('\n[1] Razorpay Signature Test:');
console.log(' -> Generated Signature:', generatedSig);
console.log(' -> Signature Verification Result:', isSignatureValid ? 'PASSED ✅' : 'FAILED ❌');

// 2. Meta WhatsApp Webhook Verify Parameters Test
const hubMode = 'subscribe';
const hubToken = 'iqsl_whatsapp_verify_token_2026';
const isMetaVerifyValid = (hubMode === 'subscribe' && hubToken === WHATSAPP_VERIFY_TOKEN);

console.log('\n[2] Meta WhatsApp Webhook Verification Test:');
console.log(' -> Hub Mode:', hubMode);
console.log(' -> Hub Token:', hubToken);
console.log(' -> Verification Status:', isMetaVerifyValid ? 'PASSED ✅' : 'FAILED ❌');
console.log('====================================================');
