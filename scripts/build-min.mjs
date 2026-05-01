// Generate minified CSS + JS for production. Run from repo root:
//
//     node scripts/build-min.mjs
//
// CSS: `css/styles.css` → `css/styles.min.css` via esbuild's CSS minifier.
// JS:  every `.js` under `js/` → in-place minified copy under `js-min/`,
//      preserving directory structure. ESM bare specifiers (e.g. `three`)
//      are left untouched so the importmap in `index.html` continues to
//      resolve them — esbuild's `transform` API does not bundle.
//
// Why not minify in place: dev tooling and source maps reference the
// readable source. `js-min/` is gitignored; `index.html` and `sw.js`
// switch their script paths to `js-min/...` before deploy.
//
// To rebuild: `node scripts/build-min.mjs`. Capacitor's `cap:sync` does
// NOT auto-run this — call `npm run build` first.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JS_SRC  = path.join(ROOT, 'js');
const JS_OUT  = path.join(ROOT, 'js-min');
const CSS_SRC = path.join(ROOT, 'css', 'styles.css');
const CSS_OUT = path.join(ROOT, 'css', 'styles.min.css');

async function* walkJs(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walkJs(full);
    else if (entry.isFile() && entry.name.endsWith('.js')) yield full;
  }
}

async function buildCss() {
  const out = await esbuild.build({
    entryPoints: [CSS_SRC],
    outfile: CSS_OUT,
    minify: true,
    write: true,
    logLevel: 'silent',
  });
  if (out.errors.length) throw new Error('css build failed');
  const before = (await fs.stat(CSS_SRC)).size;
  const after  = (await fs.stat(CSS_OUT)).size;
  console.log(`[css] ${(before / 1024).toFixed(1)} → ${(after / 1024).toFixed(1)} KiB`);
}

async function buildJs() {
  await fs.rm(JS_OUT, { recursive: true, force: true });
  let totalIn = 0, totalOut = 0, files = 0;
  for await (const src of walkJs(JS_SRC)) {
    const rel = path.relative(JS_SRC, src);
    const dst = path.join(JS_OUT, rel);
    await fs.mkdir(path.dirname(dst), { recursive: true });
    const code = await fs.readFile(src, 'utf8');
    const baseName = path.basename(dst);
    // External sourcemap: write `<name>.js.map` next to the minified
    // file and append `//# sourceMappingURL=<name>.js.map` so browsers
    // (and Lighthouse's `valid-source-maps` audit) can locate it.
    const { code: out, map } = await esbuild.transform(code, {
      minify: true,
      target: 'es2020',
      loader: 'js',
      format: 'esm',
      sourcemap: 'external',
      sourcefile: rel,
    });
    const withRef = `${out}\n//# sourceMappingURL=${baseName}.map\n`;
    await fs.writeFile(dst, withRef);
    await fs.writeFile(`${dst}.map`, map);
    totalIn  += code.length;
    totalOut += withRef.length;
    files++;
  }
  console.log(`[js] ${files} files: ${(totalIn / 1024).toFixed(1)} → ${(totalOut / 1024).toFixed(1)} KiB (+ sourcemaps)`);
}

await buildCss();
await buildJs();
