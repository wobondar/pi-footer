#!/usr/bin/env bash
# Launches pi in a pseudo-terminal, quits it, then verifies from the captured
# output that the pi-footer extension loaded and rendered the custom footer.
set -euo pipefail

load_log="$RUNNER_TEMP/pi-footer-load.log"
clean_log="$RUNNER_TEMP/pi-footer-load.clean.log"

set +e
{ sleep 3; printf '/quit\r'; } | timeout 30s script -q -e -c "pi --no-session --no-context-files --no-skills --no-prompt-templates --no-themes" "$load_log"
status=$?
set -e

python3 - "$load_log" "$clean_log" <<'PY'
import re
import sys
from pathlib import Path

raw = Path(sys.argv[1]).read_text(errors="replace")
raw = re.sub(r"\x1b\][^\a]*(?:\a|\x1b\\)", "", raw)
raw = re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", raw)
raw = raw.replace("\b", "")
Path(sys.argv[2]).write_text(raw)
print(raw[-4000:])
PY

if grep -E "Failed to load extension|Cannot find module" "$clean_log"; then
  echo "pi-footer failed to load" >&2
  exit 1
fi

if ! grep -F "unknown/unknown" "$clean_log"; then
  echo "pi-footer loaded but the expected custom footer was not rendered" >&2
  exit 1
fi

if [[ $status -ne 0 && $status -ne 124 ]]; then
  echo "pi exited with unexpected status $status" >&2
  exit "$status"
fi
