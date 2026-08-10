import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const GENERATED_PATHS = [
  'src/generated',
  'src/mutate/write-surface.gen.ts',
  'src/mutate/write-surface.interface.gen.ts',
  'src/mutate/write-surface.bridge.gen.ts',
];

async function listFiles(path) {
  const absolute = resolve(ROOT, path);
  const entries = await readdir(absolute, { withFileTypes: true }).catch(() => []);
  if (entries.length === 0) {
    return [absolute];
  }

  const files = [];
  for (const entry of entries) {
    const child = resolve(absolute, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(relative(ROOT, child))));
    } else if (entry.isFile()) {
      files.push(child);
    }
  }
  return files;
}

async function snapshot() {
  const files = (await Promise.all(GENERATED_PATHS.map(listFiles))).flat().sort();
  const result = new Map();
  for (const file of files) {
    const contents = await readFile(file).catch(() => null);
    result.set(relative(ROOT, file), contents);
  }
  return result;
}

function changedFiles(before, after) {
  const paths = new Set([...before.keys(), ...after.keys()]);
  return [...paths].filter((path) => {
    const oldContents = before.get(path);
    const newContents = after.get(path);
    return oldContents === undefined ||
      newContents === undefined ||
      oldContents === null ||
      newContents === null ||
      !oldContents.equals(newContents);
  });
}

const before = await snapshot();
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
execFileSync(pnpm, ['generate'], { cwd: ROOT, stdio: 'inherit' });
const after = await snapshot();
const changed = changedFiles(before, after);

if (changed.length > 0) {
  console.error('\nGenerated files were stale:');
  for (const path of changed) {
    console.error(`  ${path}`);
  }
  console.error('\nReview and commit the regenerated files.');
  process.exitCode = 1;
}
