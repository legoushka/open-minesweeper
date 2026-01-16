#!/bin/bash
# Auto-generate avatars.json from files in client/assets/avatars/
# Usage: ./scripts/update-avatars.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AVATARS_DIR="$PROJECT_ROOT/client/assets/avatars"
OUTPUT_FILE="$AVATARS_DIR/avatars.json"

# Find image files (excluding any .json files)
files=$(ls "$AVATARS_DIR" 2>/dev/null | grep -iE '\.(png|jpg|jpeg|gif|svg|webp)$' | sort)

if [ -z "$files" ]; then
  echo "No avatar images found in $AVATARS_DIR"
  echo "[]" > "$OUTPUT_FILE"
  exit 0
fi

# Build JSON array
echo "[" > "$OUTPUT_FILE"
first=true
for f in $files; do
  if [ "$first" = true ]; then
    printf '  "%s"' "$f" >> "$OUTPUT_FILE"
    first=false
  else
    printf ',\n  "%s"' "$f" >> "$OUTPUT_FILE"
  fi
done
echo "" >> "$OUTPUT_FILE"
echo "]" >> "$OUTPUT_FILE"

count=$(echo "$files" | grep -c .)
echo "✓ Updated avatars.json with $count avatar(s)"
