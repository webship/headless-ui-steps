#!/usr/bin/env bash
#
# Assembles the demo of this pack in a folder: Headless UI's own React playground examples
# (playgrounds/react/page-examples of github.com/tailwindlabs/headlessui at the release HUI_VERSION, with the playground's
# small components, utils and data they import), copied unchanged into a Vite React app; then this folder's own glue over
# it (the entry that picks an example by its path, a page of form fields of ours, a stand-in for the one Next.js link an
# example imports, index.html, vite.config.ts, package.json with its lock, and npmrc as the app's .npmrc: npm leaves a
# file named .npmrc out of a package). It needs bash, git and a network; it installs and builds nothing (npm ci and vite
# build come after it).
#
#   bash demo-src/assemble.sh <the folder to make>              HUI_VERSION=2.2.10 by default
#   bash demo-src/assemble.sh --minimal <the folder to make>    the glue alone: no example, one page of ours
#
# The Workspace's Headless UI plugin makes its demo (and, with --minimal, its starter) the same way, from this pack's npm
# release.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUI_VERSION="${HUI_VERSION:-2.2.10}"
MINIMAL=''
[ "${1:-}" = '--minimal' ] && { MINIMAL='yes' ; shift ; }
TARGET="${1:?the folder to make}"

if [ -e "$TARGET" ] && [ -n "$(ls -A "$TARGET" 2> /dev/null)" ]; then
  echo "$TARGET is there already and not empty: remove it to make the demo again." >&2
  exit 1
fi
if [ -n "$MINIMAL" ]; then
  # The glue alone: a Vite React app with Headless UI and Tailwind CSS 4, at the demo's versions, whose one page is the
  # pack's page of form fields.
  mkdir -p "$TARGET"
  cp "$HERE/index.html" "$HERE/package.json" "$HERE/vite.config.ts" "$TARGET/"
  cp "$HERE/npmrc" "$TARGET/.npmrc"
  [ -f "$HERE/package-lock.json" ] && cp "$HERE/package-lock.json" "$TARGET/"
  cp -r "$HERE/src/." "$TARGET/src/"
  cp "$HERE/minimal-styles.css" "$TARGET/src/styles.css"
  echo "Assembled the starter in $TARGET (Headless UI v${HUI_VERSION} for React, Tailwind CSS 4, one page)."
  exit 0
fi

work="$(mktemp -d "${TMPDIR:-/tmp}/headless-ui-steps-demo.XXXXXX")"
trap 'rm -rf "$work"' EXIT

echo "Taking Headless UI v${HUI_VERSION} for React: its playground's examples."
src="$work/headlessui"
git -c advice.detachedHead=false clone -q --depth 1 --branch "@headlessui/react@v${HUI_VERSION}" --filter=blob:none --sparse \
  https://github.com/tailwindlabs/headlessui.git "$src"
git -c advice.detachedHead=false -C "$src" sparse-checkout set playgrounds/react/page-examples playgrounds/react/components \
  playgrounds/react/utils

mkdir -p "$TARGET/src/utils/hooks"
play="$src/playgrounds/react"
cp -r "$play/page-examples" "$TARGET/src/page-examples"
cp -r "$play/components" "$TARGET/src/components"
# The helpers the examples import; resolve-all-examples.ts reads the disk with Node, for the playground's own index.
cp "$play/utils/class-names.ts" "$play/utils/match.ts" "$TARGET/src/utils/"
cp "$play/utils/hooks/use-popper.ts" "$TARGET/src/utils/hooks/"
cp "$play/data.ts" "$TARGET/src/data.ts"
cp "$src/LICENSE" "$TARGET/LICENSE.headlessui"
# This pack's glue over it.
cp "$HERE/index.html" "$HERE/package.json" "$HERE/vite.config.ts" "$TARGET/"
cp "$HERE/npmrc" "$TARGET/.npmrc"
[ -f "$HERE/package-lock.json" ] && cp "$HERE/package-lock.json" "$TARGET/"
cp -r "$HERE/src/." "$TARGET/src/"
echo "Assembled the demo in $TARGET (Headless UI v${HUI_VERSION} for React)."
