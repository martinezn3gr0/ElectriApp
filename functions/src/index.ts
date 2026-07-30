/**
 * Firebase Cloud Functions for ElectriApp.
 *
 * Privileged rating aggregation runs here so clients never write
 * rating / reviewCount on another user's profile.
 *
 * Deploy: firebase deploy --only functions
 * Requires Blaze plan and functions enabled on the Firebase project.
 *
 * Note: the Express /api/submit-review endpoint also updates ratings
 * (Admin SDK). This trigger is a safety net if a review document is
 * created by any privileged path without updating aggregates.
 */
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';

if (!getApps().length) {
  initializeApp();
}

setGlobalOptions({ region: 'us-central1' });

const DATABASE_ID = 'ai-studio-e57a910b-3bc0-4fa6-b32d-59119cff02eb';

export const onReviewCreated = onDocumentCreated(
  {
    document: 'reviews/{reviewId}',
    database: DATABASE_ID,
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    // Skip if submit-review already stamped the aggregate update marker
    if (data.ratingApplied === true) {
      return;
    }

    const electricianId = data.electricianId as string | undefined;
    const rating = data.rating as number | undefined;

    if (!electricianId || typeof rating !== 'number' || rating < 1 || rating > 5) {
      console.error('Invalid review payload; skipping rating update', data);
      return;
    }

    const db = getFirestore(getApp(), DATABASE_ID);
    const electricianRef = db.collection('users').doc(electricianId);
    const reviewRef = event.data!.ref;

    await db.runTransaction(async (tx) => {
      const [electricianSnap, reviewSnap] = await Promise.all([
        tx.get(electricianRef),
        tx.get(reviewRef),
      ]);

      if (!reviewSnap.exists) return;
      const review = reviewSnap.data() || {};
      if (review.ratingApplied === true) return;

      if (!electricianSnap.exists) {
        console.error(`Electrician ${electricianId} not found`);
        return;
      }

      const current = electricianSnap.data() || {};
      const currentRating = typeof current.rating === 'number' ? current.rating : 0;
      const currentCount = typeof current.reviewCount === 'number' ? current.reviewCount : 0;
      const newCount = currentCount + 1;
      const newRating = (currentRating * currentCount + rating) / newCount;

      tx.update(electricianRef, {
        rating: newRating,
        reviewCount: newCount,
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.update(reviewRef, { ratingApplied: true });
    });
  }
);
