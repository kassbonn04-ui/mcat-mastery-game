#!/usr/bin/env bash
# Netlify build: inject public Supabase keys into js/config.js
set -euo pipefail

URL="${SUPABASE_URL:-}"
KEY="${SUPABASE_ANON_KEY:-}"

if [[ -z "$URL" || -z "$KEY" ]]; then
  echo "WARNING: SUPABASE_URL or SUPABASE_ANON_KEY missing — cloud save will stay local-only."
  cat > js/config.js <<'EOF'
window.ARCANUM_CONFIG = { supabaseUrl: "", supabaseAnonKey: "" };
EOF
  exit 0
fi

# Escape for JS string literals
escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

ESC_URL="$(escape "$URL")"
ESC_KEY="$(escape "$KEY")"

cat > js/config.js <<EOF
window.ARCANUM_CONFIG = {
  supabaseUrl: "${ESC_URL}",
  supabaseAnonKey: "${ESC_KEY}",
};
EOF

echo "Wrote js/config.js for Netlify deploy."
