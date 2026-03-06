#!/usr/bin/env bash
# rawtxt CLI - paste text and get a raw URL
# Usage:
#   echo "hello" | rawtxt
#   cat file.md | rawtxt
#   rawtxt "inline text"

RAWTXT_URL="${RAWTXT_URL:-https://rawtxt.dev}"

if [ -n "$1" ]; then
  CONTENT="$*"
elif [ ! -t 0 ]; then
  CONTENT=$(cat)
else
  echo "Usage: echo 'text' | rawtxt  OR  rawtxt 'text'" >&2
  exit 1
fi

if [ -z "$CONTENT" ]; then
  echo "Error: empty content" >&2
  exit 1
fi

RESPONSE=$(curl -s -X POST "${RAWTXT_URL}/api/paste" \
  -H "Content-Type: text/plain" \
  -d "$CONTENT")

RAW_URL=$(echo "$RESPONSE" | grep -o '"rawUrl":"[^"]*"' | cut -d'"' -f4)

if [ -z "$RAW_URL" ]; then
  echo "Error: failed to create paste" >&2
  echo "$RESPONSE" >&2
  exit 1
fi

echo "$RAW_URL"
