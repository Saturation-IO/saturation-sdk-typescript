import { execFileSync } from 'node:child_process';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SNAPSHOT = resolve(ROOT, 'openapi/openapi.yaml');

try {
  await access(SNAPSHOT);
} catch {
  console.error('Missing openapi/openapi.yaml. Restore the committed OpenAPI snapshot before generating.');
  process.exit(1);
}

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
execFileSync(pnpm, ['exec', 'openapi-ts'], { cwd: ROOT, stdio: 'inherit' });
