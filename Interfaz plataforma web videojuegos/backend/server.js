// ============================================================
//  TDV API — v9.0  (código dividido en módulos)
//  backend/server.js — solo arranca la app y conecta las rutas.
//
//    config/       conexión a MySQL, .env y rutas de carpetas
//    middleware/   login (usuario y admin), límites de intentos, subida de imágenes
//    routes/       un archivo por tema (juegos, quiz, tienda, ...); routes/admin/ = administrador
//    services/     lógica reutilizable (pedidos, pagos con Stripe)
//    utils/        correo, validaciones, auditoría, notificaciones push
// ============================================================
import './config/env.js';                       // SIEMPRE primero: carga el .env
import express      from 'express';
import cors         from 'cors';
import cookieParser from 'cookie-parser';
import path         from 'path';
import { ROOT_DIR } from './config/paths.js';
import { apiLimiter } from './middleware/rateLimits.js';
import { startOrderExpiryJob } from './services/orders.js';

import gamesRouter            from './routes/games.js';
import platformsRouter        from './routes/platforms.js';
import sagasRouter            from './routes/sagas.js';
import tierlistRouter         from './routes/tierlist.js';
import authRouter             from './routes/auth.js';
import adminAuthRouter        from './routes/admin/auth.js';
import votesRouter            from './routes/votes.js';
import favoritesRouter from './routes/favorites.js';
import quizRouter             from './routes/quiz.js';
import userRouter             from './routes/user.js';
import adminDashboardRouter   from './routes/admin/dashboard.js';
import adminGamesRouter       from './routes/admin/games.js';
import adminReviewsRouter     from './routes/admin/reviews.js';
import adminFeaturedRouter    from './routes/admin/featured.js';
import adminPlatformsRouter   from './routes/admin/platforms.js';
import adminSagasRouter       from './routes/admin/sagas.js';
import adminTierlistRouter    from './routes/admin/tierlist.js';
import adminUsersRouter       from './routes/admin/users.js';
import adminQuizRouter        from './routes/admin/quiz.js';
import shopRouter             from './routes/shop.js';
import paymentsRouter, { stripeWebhook } from './routes/payments.js';
import adminOrdersRouter      from './routes/admin/orders.js';
import notificationsRouter    from './routes/notifications.js';
import adminNotificationsRouter from './routes/admin/notifications.js';

const app = express();
app.set('trust proxy', 1);

const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  process.env.ADMIN_URL  || 'http://localhost:5173',
];

app.use(cors({ origin: (origin, cb) => { if (!origin || ALLOWED_ORIGINS.includes(origin)) cb(null, true); else cb(new Error('Origin no permitido')); }, credentials: true }));
app.use(cookieParser());
// Webhook de Stripe: necesita el cuerpo CRUDO para verificar la firma, por eso va ANTES de express.json.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
app.use(express.json({ limit: '2mb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Content-Security-Policy', ["default-src 'self'","script-src 'self' 'unsafe-inline'","style-src 'self' 'unsafe-inline' https://fonts.googleapis.com","font-src 'self' https://fonts.gstatic.com","img-src 'self' data: blob:","media-src 'self'","frame-src https://www.youtube.com https://www.youtube-nocookie.com","connect-src 'self'","object-src 'none'","base-uri 'self'"].join('; '));
  next();
});
app.use('/uploads', express.static(path.join(ROOT_DIR, 'uploads'), { maxAge: '7d', setHeaders: (res) => res.setHeader('Cache-Control', 'public, max-age=604800') }));

app.use('/api/', apiLimiter);

// ── Rutas (todas cuelgan de /api) ─────────────────────────────
app.use('/api', gamesRouter);
app.use('/api', platformsRouter);
app.use('/api', sagasRouter);
app.use('/api', tierlistRouter);
app.use('/api', authRouter);
app.use('/api', adminAuthRouter);
app.use('/api', votesRouter);
app.use('/api', favoritesRouter);
app.use('/api', quizRouter);
app.use('/api', userRouter);
app.use('/api', adminDashboardRouter);
app.use('/api', adminGamesRouter);
app.use('/api', adminReviewsRouter);
app.use('/api', adminFeaturedRouter);
app.use('/api', adminPlatformsRouter);
app.use('/api', adminSagasRouter);
app.use('/api', adminTierlistRouter);
app.use('/api', adminUsersRouter);
app.use('/api', adminQuizRouter);
app.use('/api', shopRouter);
app.use('/api', paymentsRouter);
app.use('/api', adminOrdersRouter);
app.use('/api', notificationsRouter);
app.use('/api', adminNotificationsRouter);

startOrderExpiryJob();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🎮 TDV API v9.2 corriendo en http://localhost:${PORT}`));
