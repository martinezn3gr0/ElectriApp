import express from 'express';
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '100kb' }));

  /**
   * Authenticated: submit a review and update electrician rating with Admin SDK.
   * Clients must never write rating/reviewCount on another user's profile.
   */
  app.post('/api/submit-review', requireAuth, async (req: AuthedRequest, res) => {
    const { projectId, electricianId, rating, comment } = req.body || {};
    const uid = req.uid!;

    if (!projectId || !electricianId || typeof rating !== 'number' || !comment?.trim()) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    if (String(comment).trim().length > 2000) {
      return res.status(400).json({ error: 'Comment too long' });
    }

    try {
      const db = getAdminDb();
      const projectRef = db.collection('projects').doc(projectId);
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
      const createdAt = new Date().toISOString();

      await db.runTransaction(async (tx) => {
        const electricianSnap = await tx.get(electricianRef);
        if (!electricianSnap.exists) {
          throw new Error('ELECTRICIAN_NOT_FOUND');
        }

        const data = electricianSnap.data() || {};
        const currentRating = typeof data.rating === 'number' ? data.rating : 0;
        const currentCount = typeof data.reviewCount === 'number' ? data.reviewCount : 0;
        const newCount = currentCount + 1;
        const newRating = (currentRating * currentCount + rating) / newCount;

        tx.set(reviewRef, {
          projectId,
          clientId: uid,
          electricianId,
          rating,
          comment: String(comment).trim(),
          createdAt,
          // Prevents Cloud Function from double-counting when both paths are live
          ratingApplied: true,
        });

        tx.update(electricianRef, {
          rating: newRating,
          reviewCount: newCount,
          updatedAt: FieldValue.serverTimestamp(),
        });
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
   * Caller must be the client or assigned electrician.
   */
  app.post('/api/send-completion-email', requireAuth, async (req: AuthedRequest, res) => {
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
      const projectSnap = await db.collection('projects').doc(projectId).get();
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
      const safeName = escapeHtml(project.title);
      const safeUrl = sanitizeUrl(projectUrl || '');

      const { data, error } = await resendClient.emails.send({
        from: 'ElectriApp <notifications@resend.dev>',
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
        return res.status(500).json({ error: error.message });
      }

      return res.json({ success: true, data });
    } catch (err) {
      console.error('Server error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
