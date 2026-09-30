/**
 * One-shot backfill: users/{uid} → publicProfiles/{uid} (sin email / PII).
 *
 * Uso:
 *   FIREBASE_SERVICE_ACCOUNT_JSON='{...}' npx tsx scripts/backfill-public-profiles.ts
 *   # o
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json npx tsx scripts/backfill-public-profiles.ts
 *
 * Flags:
 *   --dry-run   Solo reporta qué escribiría (default: escribe)
 */
import dotenv from 'dotenv';
import { getAdminDb } from '../server/firebaseAdmin.ts';

dotenv.config();

type UserDoc = {
  uid?: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  bio?: string;
  skills?: string[];
  certifications?: string[];
  availability?: string;
  yearsOfExperience?: number;
  location?: string;
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
  email?: string;
};

function toPublicProfile(uid: string, data: UserDoc) {
  return {
    uid: data.uid || uid,
    displayName: data.displayName || '',
    photoURL: data.photoURL || '',
    role: data.role || 'client',
    bio: data.bio || '',
    skills: Array.isArray(data.skills) ? data.skills : [],
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    availability: data.availability || null,
    yearsOfExperience: typeof data.yearsOfExperience === 'number' ? data.yearsOfExperience : 0,
    location: data.location || '',
    rating: typeof data.rating === 'number' ? data.rating : 0,
    reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 0,
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const db = getAdminDb();

  console.log(`Backfill publicProfiles (${dryRun ? 'DRY RUN' : 'WRITE'})…`);

  const usersSnap = await db.collection('users').get();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const doc of usersSnap.docs) {
    const uid = doc.id;
    const data = doc.data() as UserDoc;
    const publicRef = db.collection('publicProfiles').doc(uid);
    const existing = await publicRef.get();
    const payload = toPublicProfile(uid, data);

    // Never copy email into public profiles
    if ('email' in payload) {
      delete (payload as { email?: string }).email;
    }

    if (!existing.exists) {
      console.log(`[create] ${uid} (${payload.role})`);
      if (!dryRun) await publicRef.set(payload);
      created += 1;
      continue;
    }

    const current = existing.data() || {};
    const needsEmailStrip = 'email' in current;
    const ratingDrift =
      current.rating !== payload.rating || current.reviewCount !== payload.reviewCount;

    if (needsEmailStrip || ratingDrift || current.displayName !== payload.displayName) {
      console.log(`[update] ${uid}${needsEmailStrip ? ' (strip email)' : ''}`);
      if (!dryRun) await publicRef.set(payload, { merge: true });
      // Explicitly delete leaked email if present
      if (!dryRun && needsEmailStrip) {
        const { FieldValue } = await import('firebase-admin/firestore');
        await publicRef.update({ email: FieldValue.delete() });
      }
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        totalUsers: usersSnap.size,
        created,
        updated,
        skipped,
        dryRun,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
