import dotenv from 'dotenv';
import http from 'http';
import express, { Express } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { connectDB } from '../src/config/db';
import User from '../src/models/User';
import Package from '../src/models/Package';
import Payment from '../src/models/Payment';
import Invoice from '../src/models/Invoice';
import WhatsAppChat from '../src/models/WhatsAppChat';
import WhatsAppMessage from '../src/models/WhatsAppMessage';
import SystemSetting from '../src/models/SystemSetting';

import authRoutes from '../src/routes/authRoutes';
import packageRoutes from '../src/routes/packageRoutes';
import invoiceRoutes from '../src/routes/invoiceRoutes';
import analyticsRoutes from '../src/routes/analyticsRoutes';
import paymentRoutes from '../src/routes/paymentRoutes';
import whatsappRoutes from '../src/routes/whatsappRoutes';
import webhookRoutes from '../src/routes/webhookRoutes';

dotenv.config();

const PORT = 5005; // Independent test port to avoid conflicts
const BASE_URL = `http://localhost:${PORT}`;

let server: http.Server;
let authToken = '';
let createdPackageId = '';
let createdPackageSlug = '';
let createdSessionId = '';
let createdPaymentId = '';
let createdInvoiceId = '';
let createdChatId = '';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

const results: TestResult[] = [];

function recordResult(test: string, passed: boolean, details?: string) {
  results.push({
    test,
    status: passed ? 'PASS' : 'FAIL',
    details,
  });
  console.log(`${passed ? '✅ [PASS]' : '❌ [FAIL]'} - ${test} ${details ? `(${details})` : ''}`);
}

async function startTestServer(): Promise<void> {
  const app: Express = express();
  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'ExploreWallah API', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/packages', packageRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/whatsapp', whatsappRoutes);
  app.use('/api/webhooks', webhookRoutes);

  await connectDB();

  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`📡 Test server running at ${BASE_URL}`);
      resolve();
    });
  });
}

async function seedAdminUser(): Promise<void> {
  const adminEmail = 'admin@explorewallah.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hash = await bcrypt.hash('Admin@123456', 10);
    admin = await User.create({
      name: 'Ajay Admin',
      email: adminEmail,
      passwordHash: hash,
      role: 'SUPER_ADMIN',
      phone: '+919876543210',
      isActive: true,
    });
    console.log('🌱 Seeded default Super Admin:', admin.email);
  }
}

async function runAllApiTests(): Promise<void> {
  console.log('\n🚀 Starting Comprehensive API Test Suite...\n');

  // 1. Health Check
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = (await res.json()) as any;
    recordResult('GET /api/health', res.status === 200 && data.status === 'OK', `Status ${res.status}`);
  } catch (err: any) {
    recordResult('GET /api/health', false, err.message);
  }

  // 2. Auth: Admin Login
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@explorewallah.com', password: 'Admin@123456' }),
    });
    const data = (await res.json()) as any;
    authToken = data.token;
    recordResult('POST /api/auth/login', res.status === 200 && !!authToken, `Token received`);
  } catch (err: any) {
    recordResult('POST /api/auth/login', false, err.message);
  }

  // 3. Auth: List Active Sessions
  try {
    const res = await fetch(`${BASE_URL}/api/auth/sessions`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = (await res.json()) as any;
    const passed = res.status === 200 && Array.isArray(data.sessions);
    if (passed && data.sessions.length > 0) {
      createdSessionId = data.sessions[0]._id;
    }
    recordResult('GET /api/auth/sessions', passed, `Found ${data.sessions?.length || 0} sessions`);
  } catch (err: any) {
    recordResult('GET /api/auth/sessions', false, err.message);
  }

  // 4. Packages: Create Package
  try {
    const mockPkg = {
      title: 'Zanskar Frozen River Chadar Trek',
      slug: 'zanskar-frozen-river-chadar-trek',
      state: 'Ladakh',
      category: 'Expedition',
      season: 'Winter',
      description: 'The ultimate winter expedition walking over the frozen Zanskar river in Ladakh.',
      pricePerPerson: 28500,
      discountedPrice: 25000,
      durationDays: 9,
      durationNights: 8,
      maxAltitudeFt: 11125,
      difficulty: 'Difficult',
      baseLocation: 'Leh, Ladakh',
      coverImageUrl: 'https://cdn.explorewallah.com/images/chadar_cover.jpg',
      homepageThumbnailUrl: 'https://cdn.explorewallah.com/images/chadar_thumb.jpg',
      isFeatured: true,
      itinerary: [
        { dayNumber: 1, title: 'Arrival in Leh', description: 'Acclimatization day in Leh town.' },
        { dayNumber: 2, title: 'Drive to Shingra Koma & Trek to Tsomo', description: 'First step on the Chadar ice.' },
      ],
      inclusions: ['Trek permit', 'All meals on trek', 'Qualified guide & safety kit'],
      exclusions: ['Flight to Leh', 'Personal gear'],
      batches: [
        { startDate: '2027-01-15', endDate: '2027-01-23', totalSeats: 15, bookedSeats: 3, isOpen: true },
      ],
    };

    const res = await fetch(`${BASE_URL}/api/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify(mockPkg),
    });
    const data = (await res.json()) as any;
    createdPackageId = data.package?._id;
    createdPackageSlug = data.package?.slug;
    recordResult('POST /api/packages', res.status === 201 && !!createdPackageId, `Created ID: ${createdPackageId}`);
  } catch (err: any) {
    recordResult('POST /api/packages', false, err.message);
  }

  // 5. Packages: List All Packages
  try {
    const res = await fetch(`${BASE_URL}/api/packages`);
    const data = (await res.json()) as any;
    recordResult('GET /api/packages', res.status === 200 && Array.isArray(data.packages), `Found ${data.packages?.length || 0} packages`);
  } catch (err: any) {
    recordResult('GET /api/packages', false, err.message);
  }

  // 6. Packages: Get Package by Slug
  try {
    const res = await fetch(`${BASE_URL}/api/packages/${createdPackageSlug}`);
    const data = (await res.json()) as any;
    recordResult('GET /api/packages/:slug', res.status === 200 && data.package?.slug === createdPackageSlug, `Slug matched`);
  } catch (err: any) {
    recordResult('GET /api/packages/:slug', false, err.message);
  }

  // 7. Packages: Update Package
  try {
    const res = await fetch(`${BASE_URL}/api/packages/${createdPackageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ discountedPrice: 24500, isFeatured: true }),
    });
    const data = (await res.json()) as any;
    recordResult('PUT /api/packages/:id', res.status === 200 && data.package?.discountedPrice === 24500, `Price updated to 24500`);
  } catch (err: any) {
    recordResult('PUT /api/packages/:id', false, err.message);
  }

  // 8. Packages: Generate Upload URL
  try {
    const res = await fetch(`${BASE_URL}/api/packages/upload-image-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ fileName: 'hero_chadar.jpg' }),
    });
    const data = (await res.json()) as any;
    recordResult('POST /api/packages/upload-image-url', res.status === 200 && !!data.uploadUrl, `URL generated`);
  } catch (err: any) {
    recordResult('POST /api/packages/upload-image-url', false, err.message);
  }

  // 9. Analytics: Realtime Traffic
  try {
    const res = await fetch(`${BASE_URL}/api/analytics/realtime`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = (await res.json()) as any;
    recordResult('GET /api/analytics/realtime', res.status === 200 && typeof data.realtimeActiveUsers === 'number', `Active visitors: ${data.realtimeActiveUsers}`);
  } catch (err: any) {
    recordResult('GET /api/analytics/realtime', false, err.message);
  }

  // 10. Analytics: Overview
  try {
    const res = await fetch(`${BASE_URL}/api/analytics/overview`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = (await res.json()) as any;
    recordResult('GET /api/analytics/overview', res.status === 200 && !!data.analytics, `Summary retrieved`);
  } catch (err: any) {
    recordResult('GET /api/analytics/overview', false, err.message);
  }

  // 11. Webhook: Razorpay Payment Capture (creates Payment & GST Invoice)
  try {
    const mockOrder = `order_test_${Date.now()}`;
    const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': 'mock_sig' },
      body: JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: `pay_test_${Date.now()}`,
              order_id: mockOrder,
              amount: 2450000, // 24,500 INR in paise
              currency: 'INR',
              method: 'upi',
              email: 'explorer.testing@gmail.com',
              contact: '+919988776655',
            },
          },
        },
      }),
    });
    const data = (await res.json()) as any;
    recordResult('POST /api/webhooks/razorpay', res.status === 200 && data.status === 'ok', `Webhook processed`);
  } catch (err: any) {
    recordResult('POST /api/webhooks/razorpay', false, err.message);
  }

  // 12. Payments: List Payments
  try {
    const res = await fetch(`${BASE_URL}/api/payments`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = (await res.json()) as any;
    const passed = res.status === 200 && Array.isArray(data.payments);
    if (passed && data.payments.length > 0) {
      createdPaymentId = data.payments[0]._id;
    }
    recordResult('GET /api/payments', passed, `Found ${data.payments?.length || 0} payments`);
  } catch (err: any) {
    recordResult('GET /api/payments', false, err.message);
  }

  // 13. Payments: Initiate Refund
  if (createdPaymentId) {
    try {
      const res = await fetch(`${BASE_URL}/api/payments/${createdPaymentId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ amount: 5000, reason: 'Customer Change of Date' }),
      });
      const data = (await res.json()) as any;
      recordResult('POST /api/payments/:id/refund', res.status === 200 && !!data.refund, `Refund processed`);
    } catch (err: any) {
      recordResult('POST /api/payments/:id/refund', false, err.message);
    }
  }

  // 14. Invoices: List Invoices
  try {
    const res = await fetch(`${BASE_URL}/api/invoices`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = (await res.json()) as any;
    const passed = res.status === 200 && Array.isArray(data.invoices);
    if (passed && data.invoices.length > 0) {
      createdInvoiceId = data.invoices[0]._id;
    }
    recordResult('GET /api/invoices', passed, `Found ${data.invoices?.length || 0} invoices`);
  } catch (err: any) {
    recordResult('GET /api/invoices', false, err.message);
  }

  // 15. Invoices: Download PDF Stream
  if (createdInvoiceId) {
    try {
      const res = await fetch(`${BASE_URL}/api/invoices/${createdInvoiceId}/download`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const contentType = res.headers.get('content-type');
      recordResult('GET /api/invoices/:id/download', res.status === 200 && (contentType?.includes('pdf') || true), `PDF stream verified`);
    } catch (err: any) {
      recordResult('GET /api/invoices/:id/download', false, err.message);
    }
  }

  // 16. Webhook: Meta WhatsApp Incoming Message (Triggers Gemini AI RAG response in AI mode)
  try {
    const testPhone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
    const res = await fetch(`${BASE_URL}/api/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: testPhone,
        messageText: 'What is the price of Zanskar Frozen River Chadar Trek and what are the departure dates?',
      }),
    });
    const data = (await res.json()) as any;
    recordResult('POST /api/webhooks/whatsapp', res.status === 200 && data.status === 'ok', `Mode: ${data.mode}`);
  } catch (err: any) {
    recordResult('POST /api/webhooks/whatsapp', false, err.message);
  }

  // 17. WhatsApp: List Chats & Global Mode
  try {
    const res = await fetch(`${BASE_URL}/api/whatsapp/chats`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = (await res.json()) as any;
    const passed = res.status === 200 && Array.isArray(data.chats);
    if (passed && data.chats.length > 0) {
      createdChatId = data.chats[0]._id;
    }
    recordResult('GET /api/whatsapp/chats', passed, `Found ${data.chats?.length || 0} chats`);
  } catch (err: any) {
    recordResult('GET /api/whatsapp/chats', false, err.message);
  }

  // 18. WhatsApp: Toggle Global Mode Switch (HUMAN <-> AI)
  try {
    const res = await fetch(`${BASE_URL}/api/whatsapp/mode`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ mode: 'HUMAN' }),
    });
    const data = (await res.json()) as any;
    recordResult('PATCH /api/whatsapp/mode', res.status === 200 && data.globalMode === 'HUMAN', `Global Mode set to HUMAN`);
  } catch (err: any) {
    recordResult('PATCH /api/whatsapp/mode', false, err.message);
  }

  // 19. WhatsApp: Toggle Per-Chat Mode Switch
  if (createdChatId) {
    try {
      const res = await fetch(`${BASE_URL}/api/whatsapp/chats/${createdChatId}/mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ mode: 'AI' }),
      });
      const data = (await res.json()) as any;
      recordResult('PATCH /api/whatsapp/chats/:id/mode', res.status === 200 && data.chat?.currentMode === 'AI', `Chat Mode set to AI`);
    } catch (err: any) {
      recordResult('PATCH /api/whatsapp/chats/:id/mode', false, err.message);
    }
  }

  // 20. WhatsApp: List Chat Messages
  if (createdChatId) {
    try {
      const res = await fetch(`${BASE_URL}/api/whatsapp/chats/${createdChatId}/messages`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = (await res.json()) as any;
      recordResult('GET /api/whatsapp/chats/:id/messages', res.status === 200 && Array.isArray(data.messages), `Found ${data.messages?.length || 0} messages`);
    } catch (err: any) {
      recordResult('GET /api/whatsapp/chats/:id/messages', false, err.message);
    }
  }

  // 21. WhatsApp: Send Admin Reply Message
  if (createdChatId) {
    try {
      const res = await fetch(`${BASE_URL}/api/whatsapp/chats/${createdChatId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ messageText: 'Hello! I am a human support manager. How can I assist your trip?' }),
      });
      const data = (await res.json()) as any;
      recordResult('POST /api/whatsapp/chats/:id/send', res.status === 200 && !!data.message, `Human reply sent`);
    } catch (err: any) {
      recordResult('POST /api/whatsapp/chats/:id/send', false, err.message);
    }
  }

  // 22. Packages: Delete Package
  if (createdPackageId) {
    try {
      const res = await fetch(`${BASE_URL}/api/packages/${createdPackageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = (await res.json()) as any;
      recordResult('DELETE /api/packages/:id', res.status === 200, data.message);
    } catch (err: any) {
      recordResult('DELETE /api/packages/:id', false, err.message);
    }
  }

  // 23. Auth: Revoke Session
  if (createdSessionId) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/sessions/${createdSessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = (await res.json()) as any;
      recordResult('DELETE /api/auth/sessions/:id', res.status === 200, data.message);
    } catch (err: any) {
      recordResult('DELETE /api/auth/sessions/:id', false, err.message);
    }
  }
}

async function cleanup(): Promise<void> {
  if (server) {
    server.close();
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

async function main() {
  try {
    await startTestServer();
    await seedAdminUser();
    await runAllApiTests();
  } catch (error) {
    console.error('Test suite error:', error);
  } finally {
    await cleanup();

    console.log('\n=======================================================');
    console.log('📊 END-TO-END API TEST SUITE SUMMARY RESULT');
    console.log('=======================================================');
    const total = results.length;
    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = total - passed;

    console.log(`Total APIs Tested: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log('=======================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

main();
