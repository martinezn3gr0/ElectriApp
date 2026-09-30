#!/usr/bin/env bash
# Deploy checklist helper for ElectriApp (Firebase + Node).
# Does not invent credentials — fails fast if tools/env are missing.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Lint"
npm run lint

echo "==> Test"
npm test

echo "==> Build frontend"
npm run build

echo "==> Build functions"
(cd functions && npm install --no-fund --no-audit && npm run build)

if ! command -v firebase >/dev/null 2>&1; then
  echo "firebase CLI not found. Install: npm i -g firebase-tools"
  echo "Then run:"
  echo "  firebase deploy --only firestore:rules,firestore:indexes,functions,hosting"
  exit 0
fi

echo "==> Firebase deploy (rules, indexes, functions, hosting)"
firebase deploy --only firestore:rules,firestore:indexes,functions,hosting

echo "Done."
echo "Remember: set FIREBASE_SERVICE_ACCOUNT_JSON, CORS_ORIGINS, RESEND_* on the Node host,"
echo "then: NODE_ENV=production npm start"
echo "Backfill public profiles if needed:"
echo "  npx tsx scripts/backfill-public-profiles.ts --dry-run"
echo "  npx tsx scripts/backfill-public-profiles.ts"
