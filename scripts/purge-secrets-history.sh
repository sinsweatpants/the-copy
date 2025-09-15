#!/bin/bash

# This script documents how to purge secrets and large binaries from git history.
# Usage examples (run in repository root):
#
# Using BFG Repo-Cleaner:
#   java -jar bfg.jar --delete-files '.env' --delete-files '*.vsix' --delete-folders 'backend/trufflehog'
#   git reflog expire --expire=now --all && git gc --prune=now --aggressive
#
# Using git filter-repo (preferred):
#   git filter-repo --invert-paths --path .env --path 'backend/trufflehog' --path-glob '*.vsix'
#   git reflog expire --expire=now --all && git gc --prune=now --aggressive
#
# After running, force-push the rewritten history:
#   git push --force

echo "This script is documentation only. Do not run in production without backups." >&2
