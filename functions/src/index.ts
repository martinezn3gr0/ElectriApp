/**
 * Firebase Cloud Functions for ElectriApp.
 *
 * - onReviewCreated: rating aggregation safety net
 * - onUserWritten: keep publicProfiles in sync without email/PII
 *
 * Deploy: firebase deploy --only functions
 * Requires Blaze plan and functions enabled on the Firebase project.
 */
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';

if (!getApps().length) {
  initializeApp();
}

setGlobalOptions({ region: 'us-central1' });

const DATABASE_ID = 'ai-studio-e57a910b-3bc0-4fa6-b32d-59119cff02eb';

function getDb() {
  return getFirestore(getApp(), DATABASE_ID);
}

function toPublicProfile(data: Record<string, unknown>) {
  return {
    uid: data.uid,
    displayName: (data.displayName as string) || '',
    photoURL: (data.photoURL as string) || '',
    role: data.role,
    bio: (data.bio as string) || '',
    skills: Array.isArray(data.skills) ? data.skills : [],
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    availability: data.availability || null,
    yearsOfExperience: typeof data.yearsOfExperience === 'number' ? data.yearsOfExperience : 0,
    location: (data.location as string) || '',
    rating: typeof data.rating === 'number' ? data.rating : 0,
    reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 0,
    createdAt: (data.createdAt as string) || new Date().toISOString(),
  };
}

export const onReviewCreated = onDocumentCreated(
  {
    document: 'reviews/{reviewId}',
    database: DATABASE_ID,
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    if (data.ratingApplied === true) {
      return;
    }

    const electricianId = data.electricianId as string | undefined;
    const rating = data.rating as number | undefined;

    if (!electricianId || typeof rating !== 'number' || rating < 1 || rating > 5) {
      console.error('Invalid review payload; skipping rating update', data);
      return;
    }

    const db = getDb();
    const electricianRef = db.collection('users').doc(electricianId);
    const publicProfileRef = db.collection('publicProfiles').doc(electricianId);
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

      const ratingUpdate = {
        rating: newRating,
        reviewCount: newCount,
        updatedAt: FieldValue.serverTimestamp(),
      };

      tx.update(electricianRef, ratingUpdate);
      tx.set(publicProfileRef, ratingUpdate, { merge: true });
      tx.update(reviewRef, { ratingApplied: true });
    });
  }
);

/** Mirror private users/{uid} → publicProfiles/{uid} without email / terms fields. */
export const onUserWritten = onDocumentWritten(
  {
    document: 'users/{uid}',
    database: DATABASE_ID,
  },
  async (event) => {
    const after = event.data?.after;
    const uid = event.params.uid as string;
    const db = getDb();
    const publicRef = db.collection('publicProfiles').doc(uid);

    if (!after?.exists) {
      await publicRef.delete().catch(() => undefined);
      return;
    }

    const data = after.data() as Record<string, unknown> | undefined;
    if (!data) return;

    await publicRef.set(toPublicProfile(data), { merge: true });
  }
);
