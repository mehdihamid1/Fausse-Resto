#!/usr/bin/env bash
# Helper: make `python3` resolve to the real Windows `python` (the WindowsApps
# `python3` is a non-executable Store alias stub), then run a .sh script.
# Usage: _run_sh_with_python3_shim.sh <script-relative-to-repo-root>
set -euo pipefail

shim_dir="$(mktemp -d)"
cat > "$shim_dir/python3" <<'EOF'
#!/bin/sh
exec python "$@"
EOF
chmod +x "$shim_dir/python3"
export PATH="$shim_dir:$PATH"

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$repo_root"
exec "./$1"
