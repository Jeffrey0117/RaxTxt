#!/usr/bin/env bash
set -euo pipefail

# rawtxt CLI — paste text, get a raw URL
# https://github.com/Jeffrey0117/RaxTxt

RAWTXT_URL="${RAWTXT_URL:-https://rawtxt.isnowfriend.com}"
EXPIRES="24h"

usage() {
  cat >&2 <<EOF
Usage: rawtxt [OPTIONS] [TEXT]

Paste text and get a raw URL for AI consumption.

Options:
  -e, --expires <TIME>  Expiration: 1h, 6h, 24h (default), 7d, 30d, forever
  -v, --view            Output view URL instead of raw URL
  -j, --json            Output full JSON response
  -h, --help            Show this help

Examples:
  echo "hello world" | rawtxt
  cat spec.md | rawtxt -e forever
  rawtxt "quick note" -e 7d
  rawtxt -e 1h < error.log
  git diff | rawtxt -e 1h

Environment:
  RAWTXT_URL  Server URL (default: https://rawtxt.isnowfriend.com)
EOF
  exit 0
}

OUTPUT="raw"
POSITIONAL=()

while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--expires) EXPIRES="$2"; shift 2 ;;
    -v|--view)    OUTPUT="view"; shift ;;
    -j|--json)    OUTPUT="json"; shift ;;
    -h|--help)    usage ;;
    -*)           echo "Unknown option: $1" >&2; exit 1 ;;
    *)            POSITIONAL+=("$1"); shift ;;
  esac
done

if [[ ${#POSITIONAL[@]} -gt 0 ]]; then
  CONTENT="${POSITIONAL[*]}"
elif [[ ! -t 0 ]]; then
  CONTENT=$(cat)
else
  usage
fi

if [[ -z "$CONTENT" ]]; then
  echo "Error: empty content" >&2
  exit 1
fi

RESPONSE=$(curl -sf -X POST "${RAWTXT_URL}/api/paste" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"content":%s,"expiresIn":"%s"}' \
    "$(echo "$CONTENT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))' 2>/dev/null \
      || echo "$CONTENT" | jq -Rs . 2>/dev/null \
      || echo "\"$(echo "$CONTENT" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g' | tr '\n' '\n' | sed ':a;N;$!ba;s/\n/\\n/g')\"" \
    )" \
    "$EXPIRES")") || {
  echo "Error: request failed" >&2
  exit 1
}

case "$OUTPUT" in
  raw)  echo "$RESPONSE" | grep -o '"rawUrl":"[^"]*"' | cut -d'"' -f4 ;;
  view) echo "$RESPONSE" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4 ;;
  json) echo "$RESPONSE" ;;
esac
