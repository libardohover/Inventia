#!/usr/bin/env bash
# Inicia INVENTIA en Linux/macOS (servidor local de producción)
set -euo pipefail
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "Se creó .env.local. Agrega tu GEMINI_API_KEY si deseas usar Gemini."
fi
npm run build
npm start
