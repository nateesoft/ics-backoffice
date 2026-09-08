import * as path from 'path';
import { repoRoot } from '../copy-with-transform.util';
import type { CopySpec } from '../copy-with-transform.util';

// The real, currently-running Collections/CustomEndpoints engine — copied verbatim (no logic
// transforms) so the generated backend's dynamic-endpoint execution never drifts from what APIs
// Gen actually does in production. Directory structure is mirrored 1:1 so every relative import
// inside these files (e.g. `../collections/entities/collection.entity`) stays valid untouched.
export function backendCopiedFiles(): CopySpec[] {
  const src = path.join(repoRoot('backend'), 'src');
  return [
    { from: path.join(src, 'collections/entities/collection.entity.ts'), to: 'src/collections/entities/collection.entity.ts' },
    { from: path.join(src, 'collections/entities/record.entity.ts'), to: 'src/collections/entities/record.entity.ts' },
    { from: path.join(src, 'collections/collections.service.ts'), to: 'src/collections/collections.service.ts' },
    { from: path.join(src, 'collections/public-api.controller.ts'), to: 'src/collections/public-api.controller.ts' },
    { from: path.join(src, 'custom-endpoints/entities/custom-endpoint.entity.ts'), to: 'src/custom-endpoints/entities/custom-endpoint.entity.ts' },
    { from: path.join(src, 'custom-endpoints/custom-endpoints.service.ts'), to: 'src/custom-endpoints/custom-endpoints.service.ts' },
    { from: path.join(src, 'custom-endpoints/custom-endpoints-executor.controller.ts'), to: 'src/custom-endpoints/custom-endpoints-executor.controller.ts' },
    { from: path.join(src, 'custom-endpoints/mapping.util.ts'), to: 'src/custom-endpoints/mapping.util.ts' },
    { from: path.join(src, 'common/pagination.ts'), to: 'src/common/pagination.ts' },
    { from: path.join(src, 'common/slug.util.ts'), to: 'src/common/slug.util.ts' },
  ];
}
