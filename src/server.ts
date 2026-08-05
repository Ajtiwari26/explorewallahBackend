import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import packageRoutes from './routes/packageRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import paymentRoutes from './routes/paymentRoutes';
import whatsappRoutes from './routes/whatsappRoutes';
import webhookRoutes from './routes/webhookRoutes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5050;

// Credentialed requests (HttpOnly refresh cookie) require an explicit origin —
// browsers reject Access-Control-Allow-Origin: * when credentials are included.
// Set CORS_ORIGINS on Render, e.g. "https://explorewallah.com,https://www.explorewallah.com"
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    service: 'ExploreWallah API',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/whatsapp/webhook', webhookRoutes); // Alias for Meta Developer Portal
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/webhooks', webhookRoutes);

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  console.log('[WebSocket] Client connected to live updates stream');

  ws.send(JSON.stringify({
    type: 'CONNECTED',
    message: 'Welcome to ExploreWallah Real-Time Event Stream'
  }));

  ws.on('message', (message: string) => {
    console.log('[WebSocket] Received:', message.toString());
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ExploreWallah Backend Server running on port ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`⚡ WebSocket Stream active on ws://localhost:${PORT}`);
  console.log(`=======================================================`);
});
