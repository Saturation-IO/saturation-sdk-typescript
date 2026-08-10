/**
 * Public usage reporting was removed from `/v1`. These negative checks prevent
 * the ergonomic client and generated layer from exposing it again by accident.
 */
import { Saturation } from '../index.js';
import * as generated from '../generated/sdk.gen.js';

declare const sat: Saturation;

// @ts-expect-error Usage reporting is not a public workspace resource.
sat.usage;

// @ts-expect-error Usage reporting is not a public project resource.
sat.projects('project_1').usage;

// @ts-expect-error The removed route must not reappear in generated operations.
generated.usageListRollups;

// @ts-expect-error The removed route must not reappear in generated operations.
generated.usageListProjectRollups;

// @ts-expect-error The removed route must not reappear in generated operations.
generated.usageListCredits;

// @ts-expect-error The removed route must not reappear in generated operations.
generated.usageListOperations;

// @ts-expect-error Endpoint-specific usage types are not part of the public SDK.
import type { UsageRollupRow } from '../index.js';
