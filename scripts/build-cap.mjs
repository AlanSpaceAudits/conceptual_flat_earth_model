// Copies the runtime PWA files into ./dist for Capacitor packaging.
// Excludes repo-only files (change log, README, scripts/, android/,
// node_modules/, dist/, .git/) so the APK stays small.

import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT  = path.join(ROOT, 'dist');

const INCLUDE = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  '.nojekyll',
  'css',
  'js',
  'assets',
];

async function main() {
  if (existsSync(OUT)) await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  for (const entry of INCLUDE) {
    const src = path.join(ROOT, entry);
    if (!existsSync(src)) {
      console.warn(`[build-cap] skip missing: ${entry}`);
      continue;
    }
    const dst = path.join(OUT, entry);
    const s = await stat(src);
    if (s.isDirectory()) {
      await cp(src, dst, { recursive: true });
    } else {
      await mkdir(path.dirname(dst), { recursive: true });
      await cp(src, dst);
    }
  }

  console.log(`[build-cap] copied ${INCLUDE.length} entries to ${path.relative(ROOT, OUT)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
