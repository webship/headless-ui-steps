#!/usr/bin/env bash
#
# Makes the second site the suite runs on: Headless UI's own Vue playground as it ships (packages/playground-vue of
# github.com/tailwindlabs/headlessui at the release HUI_VUE_VERSION), a Vite app on the Vue line of Headless UI. In its
# repository it takes @headlessui/vue and @headlessui/tailwindcss from the repository's own packages, and @popperjs/core
# from its root: here they come from npm (its "*" resolves to the release; @headlessui/tailwindcss, which its
# tailwind.config.js asks for, and @popperjs/core, which its playground-utils import, are added at 0.2.2 and 2.11.8). Its
# lock is this pack's (.github/vue/package-lock.json). Built with Vite in a Node.js container, into vue/
# beside .github/; its own build script first builds the repository's packages, so only Vite runs.
#
#   NODE_IMAGE        the image it runs in (default: Node.js 24 on Debian bookworm, slim, pinned by its digest)
#   HUI_VUE_VERSION   the release of Headless UI for Vue (default 1.7.23)
#   VUE_DIR           where the app goes (default: vue/, beside .github/)
#
# Headless UI's code is released under the MIT licence by Tailwind Labs; nothing of it is kept in this repository.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
NODE_IMAGE="${NODE_IMAGE:-node:24-bookworm-slim@sha256:873f586f3794f52281bd039bf02c048a0be08fde619338f9941bad1eb6b34530}"
HUI_VUE_VERSION="${HUI_VUE_VERSION:-1.7.23}"
VUE_DIR="${VUE_DIR:-$ROOT/vue}"

if [ -e "$VUE_DIR" ]; then
  echo "$VUE_DIR is there already: remove it to make the app again." >&2
  exit 1
fi
work="$(mktemp -d "${TMPDIR:-/tmp}/headless-ui-steps-vue.XXXXXX")"
trap 'rm -rf "$work"' EXIT

echo "Taking Headless UI v${HUI_VUE_VERSION} for Vue: its playground."
git -c advice.detachedHead=false clone -q --depth 1 --branch "@headlessui/vue@v${HUI_VUE_VERSION}" --filter=blob:none --sparse \
  https://github.com/tailwindlabs/headlessui.git "$work/headlessui"
git -c advice.detachedHead=false -C "$work/headlessui" sparse-checkout set packages/playground-vue
mkdir -p "$VUE_DIR"
cp -r "$work/headlessui/packages/playground-vue/." "$VUE_DIR/"
cp "$work/headlessui/LICENSE" "$VUE_DIR/LICENSE.headlessui"
[ -f "$ROOT/.github/vue/package-lock.json" ] && cp "$ROOT/.github/vue/package-lock.json" "$VUE_DIR/package-lock.json"

parent="$(dirname "$VUE_DIR")"
name="$(basename "$VUE_DIR")"
docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -e npm_config_cache=/tmp/.npm -e npm_config_update_notifier=false \
  -e npm_config_fund=false -e npm_config_audit=false -v "$parent:/work" -w "/work/$name" "$NODE_IMAGE" bash -c "
    { if [ -f package-lock.json ]; then npm ci; else echo 'No .github/vue/package-lock.json: npm install writes one.'; npm install && npm install --save @headlessui/tailwindcss@0.2.2 @popperjs/core@2.11.8; fi; } \
    && NODE_ENV=production npx vite build \
    && node -e \"for (const p of ['@headlessui/vue', 'vue', 'tailwindcss', 'vite']) console.log(p, require('./node_modules/' + p + '/package.json').version)\"
  " < /dev/null

echo "Built the Vue playground into $VUE_DIR/dist"
