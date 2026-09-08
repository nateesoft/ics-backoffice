import * as path from 'path';
import { repoRoot } from '../copy-with-transform.util';
import type { CopySpec } from '../copy-with-transform.util';

// The real, currently-running renderer runtime (JsonForms wiring, action-step interpreter,
// sitemap-navigation logic) — copied verbatim, except UisGenLivePreview's one deliberate
// same-origin -> include cookie transform (needed once frontend/backend run on different ports).
// Same directory layout + the same `@/*` -> project-root alias as the real frontend (see
// generated tsconfig.json), so every `@/...` import inside these files resolves unmodified.
export function frontendCopiedFiles(): CopySpec[] {
  const root = repoRoot('frontend');
  return [
    { from: path.join(root, 'types/flowUi.ts'), to: 'types/flowUi.ts' },
    { from: path.join(root, 'types/uisGen.ts'), to: 'types/uisGen.ts' },
    { from: path.join(root, 'components/flow-generate/ui-builder/customRenderers.tsx'), to: 'components/flow-generate/ui-builder/customRenderers.tsx' },
    { from: path.join(root, 'components/flow-generate/ui-builder/customControlRenderers.tsx'), to: 'components/flow-generate/ui-builder/customControlRenderers.tsx' },
    { from: path.join(root, 'components/flow-generate/ui-builder/actionRunner.ts'), to: 'components/flow-generate/ui-builder/actionRunner.ts' },
    { from: path.join(root, 'components/flow-generate/ui-builder/jsonforms-vanilla.css'), to: 'components/flow-generate/ui-builder/jsonforms-vanilla.css' },
    { from: path.join(root, 'components/uis-gen/AlertBox.tsx'), to: 'components/uis-gen/AlertBox.tsx' },
    { from: path.join(root, 'components/uis-gen/ShellFrame.tsx'), to: 'components/uis-gen/ShellFrame.tsx' },
    { from: path.join(root, 'components/ui/Modal.tsx'), to: 'components/ui/Modal.tsx' },
    {
      from: path.join(root, 'components/uis-gen/UisGenLivePreview.tsx'),
      to: 'components/uis-gen/UisGenLivePreview.tsx',
      transforms: [["credentials: 'same-origin'", "credentials: 'include'"]],
    },
  ];
}
