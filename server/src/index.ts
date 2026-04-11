import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { addClient } from './utils/sseManager';
import authRoutes from './routes/authRoutes';
import bookingRoutes from './routes/bookingRoutes';
import captainRoutes from './routes/captainRoutes';
import addressRoutes from './routes/addressRoutes';
import bidRoutes from './routes/bidRoutes';
import officeRoutes from './routes/officeRoutes';
import adminRoutes from './routes/adminRoutes';
import { authenticate } from './middleware/authMiddleware';

const app = express();
const prisma = new PrismaClient();

// Trust proxy (for nginx / load balancer)
app.set('trust proxy', 1);

// CORS — dynamic origin from env
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/captains', captainRoutes);        // /nearby and /location
app.use('/api/addresses', addressRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/offices', officeRoutes);
app.use('/api/admin', adminRoutes);

// Captain toggle online status + basePrice
app.patch('/api/captain/toggle-online', authenticate, async (req: any, res) => {
  const updateData: any = { isOnline: Boolean(req.body.isOnline) };
  if (req.body.basePrice && typeof req.body.basePrice === 'number') {
    updateData.basePrice = req.body.basePrice;
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
    select: { isOnline: true, basePrice: true },
  });
  res.json({ success: true, isOnline: user.isOnline, basePrice: user.basePrice });
});

// SSE: customer watches live tanker location for a booking
app.get('/api/tracking/:bookingId', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('data: {"type":"connected"}\n\n');
  addClient(req.params.bookingId, res);
});

app.get('/api/health', (_req, res) => res.json({ status: 'OK', time: new Date().toISOString() }));

// ── Heartbeat cleanup — auto-offline stale captains ──────────────────────
// Every 5 minutes, check CaptainLocation.updatedAt — if older than 5 min,
// set the captain offline. This replaces the unreliable beforeunload handler.
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const STALE_THRESHOLD_MS = 5 * 60 * 1000;    // 5 minutes

setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);
    // Find captains who are online but haven't updated location recently
    const staleCaptains = await prisma.captainLocation.findMany({
      where: { updatedAt: { lt: cutoff }, captain: { isOnline: true } },
      select: { captainId: true },
    });

    if (staleCaptains.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: staleCaptains.map(c => c.captainId) }, isOnline: true },
        data: { isOnline: false },
      });
      console.log(`[heartbeat] Set ${staleCaptains.length} stale captain(s) offline`);
    }
  } catch (e: any) {
    console.warn('[heartbeat] cleanup error:', e.message);
  }
}, HEARTBEAT_INTERVAL_MS);

// ── Start server immediately — non-blocking ──────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`=> WaterFlow API running on :${PORT}`);

  // Kafka starts async in background — server already accepting requests
  import('./utils/kafka').then(({ initKafka }) => {
    initKafka()
      .then(() => console.log('=> Kafka connected'))
      .catch(e => console.warn('Kafka offline — SSE direct-push active:', e.message));
  });
});
