#!/usr/bin/env sh
set -eu

HOST_ENTRY="127.0.0.1 fausse-cafe.com"

if grep -q "fausse-cafe.com" /etc/hosts; then
  echo "fausse-cafe.com already exists in /etc/hosts"
  exit 0
fi

printf "\n%s\n" "$HOST_ENTRY" | sudo tee -a /etc/hosts >/dev/null
echo "Added: $HOST_ENTRY"
