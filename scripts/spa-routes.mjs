#!/usr/bin/env node
/**
 * Gives every edition's path its own copy of the app shell after `vite build`.
 *
 * The page has no router; it reads `location.pathname` (src/edition.ts). The
 * dev server falls back to index.html for any path, but a plain static host
 * answers `/studio` with a 404 unless a file is there — so one is put there.
 * The same approach the Hitachi build uses for `/analytics`.
 */
import { copyFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const ROUTES = ['studio']

for (const route of ROUTES) {
  const dir = join('dist', route)
  mkdirSync(dir, { recursive: true })
  copyFileSync(join('dist', 'index.html'), join(dir, 'index.html'))
  console.log(`dist/${route}/index.html`)
}
