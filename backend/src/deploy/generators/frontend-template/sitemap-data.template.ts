import type { DeployManifest } from '../../manifest/manifest.types';

// Generated at deploy time — the whole sitemap graph baked as static data, so the deployed app is
// fully standalone (no runtime fetch back to the main ICS Backoffice DB).
export function renderSitemapDataTs(manifest: DeployManifest, loginPath: string): string {
  // Trimmed to exactly the fields LivePreviewNodeRef declares (id/type/data) — the raw sitemap
  // graph carries extra xyflow-only fields (position, etc.) that both aren't needed at runtime and
  // trip TypeScript's excess-property check on a directly-typed object literal.
  const nodeRefs = (manifest.sitemap.nodes as Array<{ id: string; type: string; data: unknown }>)
    .map(n => ({ id: n.id, type: n.type, data: n.data }));

  return `// Generated at deploy time — do not edit by hand, it will be overwritten on redeploy.
import type { LivePreviewNodeRef } from '@/components/uis-gen/UisGenLivePreview';
import type { NavPosition } from '@/types/uisGen';

export interface RouteManifestEntry { nodeId: string; type: 'page' | 'content'; routePath: string; name: string }
export interface AccessMapEntry { nodeId: string; allowedActorNodeIds: string[] }

export const SITEMAP_NODES: LivePreviewNodeRef[] = ${JSON.stringify(nodeRefs)};
export const ROUTE_MANIFEST: RouteManifestEntry[] = ${JSON.stringify(manifest.routeManifest)};
export const ACCESS_MAP: AccessMapEntry[] = ${JSON.stringify(manifest.accessMap)};
export const PROJECT = ${JSON.stringify(manifest.project)} as { id: string; name: string; navPosition: NavPosition; themeColor: string; hasNav: boolean };
export const LOGIN_PATH = ${JSON.stringify(loginPath)};
`;
}
