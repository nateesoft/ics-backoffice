import type { ManifestRouteEntry } from '../../manifest/manifest.types';

interface PageLikeData {
  schema: unknown;
  uiSchema: unknown;
  data: Record<string, unknown>;
}

// One real, routed page per Page/Content node — thin wrappers around the SAME UisGenLivePreview
// component Preview uses, with `onNavigate` now doing a real `router.push` instead of swapping
// Preview's in-memory `path` state. 'page' nodes render full-screen (no shell), matching Preview's
// own page-vs-content distinction; 'content' nodes get the shared ShellFrame chrome + nav links
// filtered by the current session's actor (useShellNav).
export function renderPageNodeTsx(route: ManifestRouteEntry, nodeData: PageLikeData): string {
  return `'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UisGenLivePreview from '@/components/uis-gen/UisGenLivePreview';
import { SITEMAP_NODES } from '@/lib/sitemap-data';

const SCHEMA = ${JSON.stringify(nodeData.schema)};
const UI_SCHEMA = ${JSON.stringify(nodeData.uiSchema)};
const INITIAL_DATA = ${JSON.stringify(nodeData.data)};

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown>>(INITIAL_DATA);
  return (
    <div className="min-h-screen p-6">
      <UisGenLivePreview
        schema={SCHEMA}
        uiSchema={UI_SCHEMA}
        data={data}
        onDataChange={setData}
        initialData={INITIAL_DATA}
        nodes={SITEMAP_NODES}
        onNavigate={path => router.push(path)}
      />
    </div>
  );
}
`;
}

export function renderContentNodeTsx(route: ManifestRouteEntry, nodeData: PageLikeData): string {
  return `'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ShellFrame from '@/components/uis-gen/ShellFrame';
import UisGenLivePreview from '@/components/uis-gen/UisGenLivePreview';
import { SITEMAP_NODES, PROJECT } from '@/lib/sitemap-data';
import { useShellNav } from '@/lib/use-shell-nav';

const SCHEMA = ${JSON.stringify(nodeData.schema)};
const UI_SCHEMA = ${JSON.stringify(nodeData.uiSchema)};
const INITIAL_DATA = ${JSON.stringify(nodeData.data)};
const ROUTE_PATH = ${JSON.stringify(route.routePath)};

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown>>(INITIAL_DATA);
  const { navLinks } = useShellNav();
  return (
    <ShellFrame
      hasNav={PROJECT.hasNav}
      navPosition={PROJECT.navPosition}
      themeColor={PROJECT.themeColor}
      projectName={PROJECT.name}
      navLinks={navLinks}
      activePath={ROUTE_PATH}
      onNavigate={path => router.push(path)}
    >
      <UisGenLivePreview
        schema={SCHEMA}
        uiSchema={UI_SCHEMA}
        data={data}
        onDataChange={setData}
        initialData={INITIAL_DATA}
        nodes={SITEMAP_NODES}
        onNavigate={path => router.push(path)}
      />
    </ShellFrame>
  );
}
`;
}
