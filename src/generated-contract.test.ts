import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as sdk from './generated/sdk.gen.js';

const contractPath = new URL('../openapi/openapi.yaml', import.meta.url);

function operationExportName(operationId: string): string {
  return operationId.replace(/[-_]([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

describe('generated SDK contract coverage', () => {
  it('exports one function for every public API operation and no extras', () => {
    const yaml = readFileSync(contractPath, 'utf8');
    const paths = yaml.split('\npaths:\n')[1]?.split('\nwebhooks:\n')[0];
    expect(paths).toBeDefined();

    const expected = [...paths!.matchAll(/^      operationId: (\S+)$/gm)]
      .map((match) => operationExportName(match[1]!))
      .sort();
    const actual = Object.entries(sdk)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort();

    expect(expected).toHaveLength(157);
    expect(actual).toEqual(expected);
  });
});
