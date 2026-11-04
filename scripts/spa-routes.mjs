#!/usr/bin/env node
/**
 * Gives every edition's path its own copy of the app shell after `vite build`.
 *
 * The app reads `location.pathname` (src/edition.ts, src/router.ts). The dev
 * server falls back to index.html for any path, but a plain static host
 * answers `/over-ons` with a 404 unless a file is there — so one is put there.
 * The same approach the Hitachi build uses for `/analytics`.
 */
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// The two editions, every page that used to live on solistractor.nl
// (src/router.ts) and each dealer's page (src/data/pages.json).
const pages = JSON.parse(readFileSync(join('src', 'data', 'pages.json'), 'utf8'))
const ROUTES = ['studio', ...Object.keys(pages.pages), ...Object.keys(pages.dealers).map((slug) => `dealers/${slug}`)]

for (const route of ROUTES) {
  const dir = join('dist', route)
  mkdirSync(dir, { recursive: true })
  copyFileSync(join('dist', 'index.html'), join(dir, 'index.html'))
}
// Anything else: the app shell again, which shows its own "page not found".
copyFileSync(join('dist', 'index.html'), join('dist', '404.html'))
console.log(`${ROUTES.length} routes + 404.html`)
