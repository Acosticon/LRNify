#!/bin/bash
# Gjør "firebase deploy" klart til bruk i Claude Code på web, uten at noen må
# kjøre `firebase login` interaktivt (den åpner en nettleser denne økten ikke
# har). Ingen hemmelighet ligger i denne filen — den leser bare miljøvariabler
# som allerede er satt opp i selve økt-/miljøinnstillingene.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if ! command -v firebase >/dev/null 2>&1; then
  npm install -g firebase-tools >/dev/null 2>&1
fi

# Foretrukket: en tjenestekonto-nøkkel (JSON) i miljøvariabelen
# GOOGLE_APPLICATION_CREDENTIALS_JSON. Opprettes i Google Cloud Console for
# prosjektet poll-c6bd2 → IAM & Admin → Service Accounts, med rollen
# "Firebase Realtime Database Admin" (eller "Editor"). Legges inn som
# miljøvariabel i Claude Code-miljøets innstillinger (ikke i denne filen).
if [ -n "${GOOGLE_APPLICATION_CREDENTIALS_JSON:-}" ] && [ ! -f /tmp/firebase-service-account.json ]; then
  echo "$GOOGLE_APPLICATION_CREDENTIALS_JSON" > /tmp/firebase-service-account.json
  chmod 600 /tmp/firebase-service-account.json
  echo 'export GOOGLE_APPLICATION_CREDENTIALS=/tmp/firebase-service-account.json' >> "$CLAUDE_ENV_FILE"
fi

# Alternativ: en eldre CI-token fra `firebase login:ci`, i FIREBASE_TOKEN.
# firebase-tools plukker den opp automatisk uten noe ekstra herfra.

# .firebaserc i repo-rota peker allerede på poll-c6bd2, så `firebase use` er
# ikke nødvendig så lenge kommandoer kjøres fra repo-rota.
