#!/usr/bin/env bash
# Runs prettier + eslint --fix on files changed in the working tree
# (staged, unstaged, or untracked) when Claude finishes a task.
set -uo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$repo_root" || exit 0

existing=()
while IFS= read -r f; do
  [ -n "$f" ] && [ -f "$f" ] && existing+=("$f")
done < <(
  git status --porcelain --untracked-files=all -- \
    '*.ts' '*.tsx' '*.js' '*.jsx' '*.mjs' '*.cjs' 2>/dev/null |
    cut -c4- |
    sed -E 's/.* -> //'
)

[ ${#existing[@]} -eq 0 ] && exit 0

npx prettier --write "${existing[@]}" >/dev/null 2>&1
npx eslint --fix "${existing[@]}" >/dev/null 2>&1

exit 0
