// Bundles the engine and one tour into a single self-contained HTML file.
// Usage: node build.mjs [tours/<name>]   (defaults to every folder in tours/)

import { build } from 'esbuild';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

async function buildTour(dir) {
  const name = dir.split('/').pop();
  const js = await build({ entryPoints: [`${dir}/main.js`], bundle: true, format: 'iife', write: false });

  let css = await readFile('engine/engine.css', 'utf8');
  if (existsSync(`${dir}/tour.css`)) css += await readFile(`${dir}/tour.css`, 'utf8');

  const meta = JSON.parse(await readFile(`${dir}/tour.json`, 'utf8'));

  // A closing script tag inside the bundle would end the inline script early.
  const script = js.outputFiles[0].text.replaceAll('</script', '<\\/script');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${meta.title}</title>
<style>${css}</style>
</head>
<body>
<div id="app"></div>
<script>${script}</script>
</body>
</html>
`;

  await mkdir('dist', { recursive: true });
  await writeFile(`dist/${name}.html`, html);
  console.log(`dist/${name}.html ${(html.length / 1024).toFixed(0)} KB`);
}

const arg = process.argv[2];
const dirs = arg ? [arg.replace(/\/$/, '')] : (await readdir('tours')).map((name) => `tours/${name}`);
for (const dir of dirs) await buildTour(dir);
