import { describe, expect, it, vi } from 'vitest';

import type { Transport } from '../http.js';
import * as sdk from '../generated/sdk.gen.js';
import { ProjectsResource } from './core.js';

describe('project resources', () => {
  it('requests the pinned brief only when assumptions are expanded', async () => {
    const run = vi.fn(async () => ({ id: 'prj_1' }));
    const transport = { run } as unknown as Transport;

    await new ProjectsResource(transport).get('prj_1', {
      expand: ['assumptions'],
    });

    expect(run).toHaveBeenCalledWith(sdk.projectsGet, {
      path: { projectId: 'prj_1' },
      query: { expand: ['assumptions'] },
    });
  });
});
