#!/usr/bin/env bash

set -e

pnpm lint
git add .
git commit -m "$*"
git push

# pnpm push "Commit message"
