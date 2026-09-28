#!/bin/bash
# Half-done rebase, merge or pick: committing now would bake in conflict markers
for s in rebase-merge rebase-apply MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD; do
  [ -e "$(git rev-parse --git-path "$s")" ] && { echo "Unfinished rebase, merge, cherry-pick or revert: finish it (--continue) or --abort first"; exit 1; }
done
[ -n "$(git branch --show-current)" ] || { echo "Not on a branch: git switch to one first"; exit 1; }
git add .
if ! git diff --cached --quiet; then
  read -rp "Enter the commit message: " commit
  # Commit refused (empty message, hook): stop, never push stale work
  git commit -m "$commit" || exit 1
fi
# Rejected: remote moved on, so rebase onto it and retry
git push -u origin HEAD || { git pull --rebase origin "$(git branch --show-current)" && git push -u origin HEAD; }
