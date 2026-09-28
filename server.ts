import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { FieldValue } from 'firebase-admin/firestore';

import { requireAuth, type AuthedRequest } from './server/authMiddleware';
import { getAdminDb } from './server/firebaseAdmin';
import { escapeHtml, sanitizeUrl } from './server/sanitize';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY is not set. Email functionality will be disabled.');
      return null;
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

function parseAllowedOrigins(): string[] | true {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw || raw === '*') {
    // In production require an explicit allow-list; in dev allow all.
    if (process.env.NODE_ENV === 'production') {
      console.warn('CORS_ORIGINS not set in production — defaulting to same-origin only.');
      return [];
    }
    return true;
  }
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: [
                "'self'",
                'https://*.googleapis.com',
                'https://*.firebaseio.com',
                'https://*.cloudfunctions.net',
                'wss://*.firebaseio.com',
                'https://identitytoolkit.googleapis.com',
                'https://securetoken.googleapis.com',
              ],
              frameSrc: [
                "'self'",
                'https://*.firebaseapp.com',
                'https://accounts.google.com',
                'https://www.facebook.com',
              ],
              fontSrc: ["'self'", 'data:'],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  const allowedOrigins = parseAllowedOrigins();
  app.use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    })
  );

  app.use(express.json({ limit: '100kb' }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  });

  const reviewLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Review rate limit exceeded' },
  });

  const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Email rate limit exceeded' },
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'electriapp',
      env: isProd ? 'production' : 'development',
      time: new Date().toISOString(),
    });
  });

  app.use('/api/', apiLimiter);

  /**
   * Authenticated: submit a review and update electrician rating with Admin SDK.
   */
  app.post('/api/submit-review', requireAuth, reviewLimiter, async (req: AuthedRequest, res) => {
    const { projectId, electricianId, rating, comment } = req.body || {};
    const uid = req.uid!;

    if (!projectId || !electricianId || typeof rating !== 'number' || !comment?.trim()) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    if (String(comment).trim().length > 2000) {
      return res.status(400).json({ error: 'Comment too long' });
    }

    try {
      const db = getAdminDb();
      const projectRef = db.collection('projects').doc(String(projectId));
      const projectSnap = await projectRef.get();

      if (!projectSnap.exists) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const project = projectSnap.data()!;
      if (project.clientId !== uid) {
        return res.status(403).json({ error: 'Only the project client can leave a review' });
      }
      if (project.status !== 'completed') {
        return res.status(400).json({ error: 'Project must be completed before reviewing' });
      }
      if (project.electricianId !== electricianId) {
        return res.status(400).json({ error: 'Electrician does not match project assignment' });
      }

      const existing = await db
        .collection('reviews')
        .where('projectId', '==', projectId)
        .where('clientId', '==', uid)
        .limit(1)
        .get();

      if (!existing.empty) {
        return res.status(409).json({ error: 'You already reviewed this project' });
      }

      const reviewRef = db.collection('reviews').doc();
      const electricianRef = db.collection('users').doc(electricianId);
      const publicProfileRef = db.collection('publicProfiles').doc(electricianId);
      const createdAt = new Date().toISOString();
      const safeRating = Math.round(rating * 10) / 10;

      await db.runTransaction(async (tx) => {
        const electricianSnap = await tx.get(electricianRef);
        if (!electricianSnap.exists) {
          throw new Error('ELECTRICIAN_NOT_FOUND');
        }

        const data = electricianSnap.data() || {};
        const currentRating = typeof data.rating === 'number' ? data.rating : 0;
        const currentCount = typeof data.reviewCount === 'number' ? data.reviewCount : 0;
        const newCount = currentCount + 1;
        const newRating = (currentRating * currentCount + safeRating) / newCount;

        tx.set(reviewRef, {
          projectId,
          clientId: uid,
          electricianId,
          rating: safeRating,
          comment: String(comment).trim(),
          createdAt,
          ratingApplied: true,
        });

        const ratingUpdate = {
          rating: newRating,
          reviewCount: newCount,
          updatedAt: FieldValue.serverTimestamp(),
        };

        tx.update(electricianRef, ratingUpdate);
        tx.set(publicProfileRef, ratingUpdate, { merge: true });
      });

      return res.json({ success: true, reviewId: reviewRef.id });
    } catch (err) {
      if (err instanceof Error && err.message === 'ELECTRICIAN_NOT_FOUND') {
        return res.status(404).json({ error: 'Electrician not found' });
      }
      console.error('submit-review error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Authenticated: notify client + electrician that a project was completed.
   */
  app.post('/api/send-completion-email', requireAuth, emailLimiter, async (req: AuthedRequest, res) => {
    const { projectId, projectUrl } = req.body || {};
    const uid = req.uid!;

    if (!projectId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const resendClient = getResend();
    if (!resendClient) {
      return res.status(503).json({ error: 'Email service not configured' });
    }

    try {
      const db = getAdminDb();
      const projectSnap = await db.collection('projects').doc(String(projectId)).get();
      if (!projectSnap.exists) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const project = projectSnap.data()!;
      const isParty =
        project.clientId === uid ||
        (project.electricianId && project.electricianId === uid);

      if (!isParty) {
        return res.status(403).json({ error: 'Not allowed to notify for this project' });
      }

      if (project.status !== 'completed' && project.status !== 'in-progress') {
        return res.status(400).json({ error: 'Project is not in a notifiable state' });
      }

      if (!project.electricianId) {
        return res.status(400).json({ error: 'Project has no assigned electrician' });
      }

      const [clientSnap, electricianSnap] = await Promise.all([
        db.collection('users').doc(project.clientId).get(),
        db.collection('users').doc(project.electricianId).get(),
      ]);

      if (!clientSnap.exists || !electricianSnap.exists) {
        return res.status(404).json({ error: 'User profiles not found' });
      }

      const clientEmail = clientSnap.data()!.email as string;
      const electricianEmail = electricianSnap.data()!.email as string;
      if (!clientEmail || !electricianEmail) {
        return res.status(400).json({ error: 'Missing participant emails' });
      }

      const safeName = escapeHtml(project.title);
      const safeUrl = sanitizeUrl(projectUrl || '');
      const fromAddress =
        process.env.RESEND_FROM_EMAIL || 'ElectriApp <notifications@resend.dev>';

      const { data, error } = await resendClient.emails.send({
        from: fromAddress,
        to: [clientEmail, electricianEmail],
        subject: `Proyecto Completado: ${String(project.title).slice(0, 120)}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #2563eb; text-align: center;">¡Proyecto Completado!</h1>
            <p>Hola,</p>
            <p>El proyecto <strong>"${safeName}"</strong> ha sido marcado como completado en ElectriApp.</p>
            <p>Por favor, confirma el estado final y deja una reseña si aún no lo has hecho.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${safeUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Proyecto</a>
            </div>
            <p style="color: #666; font-size: 14px;">Gracias por usar ElectriApp.</p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        return res.status(500).json({ error: 'Failed to send email' });
      }

      return res.json({ success: true, data });
    } catch (err) {
      console.error('Server error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1h', index: false }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ElectriApp server listening on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
