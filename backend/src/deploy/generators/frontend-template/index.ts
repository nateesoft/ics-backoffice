import { copyWithTransform, writeGeneratedFile } from '../copy-with-transform.util';
import { frontendCopiedFiles } from './copied-files';
import { routePathToAppFile } from './route-path.util';
import {
  renderPackageJson, renderNextConfigTs, renderTsconfigJson, renderPostcssConfig,
  renderLayoutTsx, renderGlobalsCss, renderNextEnvDts,
} from './core-files.template';
import { renderSitemapDataTs } from './sitemap-data.template';
import { renderUseShellNavTs } from './use-shell-nav.template';
import { renderProxyTs } from './proxy.template';
import { renderLoginPageTsx } from './login-page.template';
import { renderPageNodeTsx, renderContentNodeTsx } from './route-page.template';
import { renderFrontendDockerfile } from './dockerfile.template';
import type { DeployManifest } from '../../manifest/manifest.types';

export interface GeneratedFrontendConfig {
  apiBaseUrl: string; // browser-reachable backend URL, baked in at build time (NEXT_PUBLIC_API_URL)
}

interface SitemapNode {
  id: string;
  type: string;
  data: { schema?: unknown; uiSchema?: unknown; data?: Record<string, unknown> };
}

// Resolves the login route, falling back to a path unlikely to collide if the designed project
// itself already has a page/content node at "/login". The fallback must NOT start with `_` —
// Next.js App Router treats any `_`-prefixed folder as a "private folder", excluded from routing
// entirely (confirmed against node_modules/next/dist/docs/.../02-project-structure.md), which
// would silently 404 instead of just being an unlikely name.
function resolveLoginPath(manifest: DeployManifest): string {
  const taken = new Set(manifest.routeManifest.map(r => r.routePath));
  if (!taken.has('/login')) return '/login';
  let candidate = '/uisgen-login';
  let suffix = 2;
  while (taken.has(candidate)) { candidate = `/uisgen-login-${suffix}`; suffix++; }
  return candidate;
}

export function generateFrontend(targetDir: string, manifest: DeployManifest, config: GeneratedFrontendConfig, packageName: string): void {
  for (const spec of frontendCopiedFiles()) {
    copyWithTransform(spec, targetDir);
  }

  writeGeneratedFile(targetDir, 'package.json', renderPackageJson(packageName));
  writeGeneratedFile(targetDir, 'next.config.ts', renderNextConfigTs());
  writeGeneratedFile(targetDir, 'tsconfig.json', renderTsconfigJson());
  writeGeneratedFile(targetDir, 'next-env.d.ts', renderNextEnvDts());
  writeGeneratedFile(targetDir, 'postcss.config.mjs', renderPostcssConfig());
  writeGeneratedFile(targetDir, 'app/layout.tsx', renderLayoutTsx());
  writeGeneratedFile(targetDir, 'app/globals.css', renderGlobalsCss());
  writeGeneratedFile(targetDir, '.env', `NEXT_PUBLIC_API_URL=${config.apiBaseUrl}\nINTERNAL_API_URL=http://backend:3001\n`);
  writeGeneratedFile(targetDir, 'Dockerfile', renderFrontendDockerfile());

  const loginPath = resolveLoginPath(manifest);
  writeGeneratedFile(targetDir, 'lib/sitemap-data.ts', renderSitemapDataTs(manifest, loginPath));
  writeGeneratedFile(targetDir, 'lib/use-shell-nav.ts', renderUseShellNavTs());
  writeGeneratedFile(targetDir, routePathToAppFile(loginPath), renderLoginPageTsx());

  const hasProtectedRoutes = manifest.accessMap.some(a => a.allowedActorNodeIds.length > 0);
  if (hasProtectedRoutes) {
    writeGeneratedFile(targetDir, 'proxy.ts', renderProxyTs(manifest, loginPath));
  }

  const nodesById = new Map((manifest.sitemap.nodes as SitemapNode[]).map(n => [n.id, n]));
  for (const route of manifest.routeManifest) {
    const node = nodesById.get(route.nodeId);
    if (!node) continue;
    const nodeData = { schema: node.data.schema ?? {}, uiSchema: node.data.uiSchema ?? { type: 'VerticalLayout', elements: [] }, data: node.data.data ?? {} };
    const file = routePathToAppFile(route.routePath);
    const content = route.type === 'page' ? renderPageNodeTsx(route, nodeData) : renderContentNodeTsx(route, nodeData);
    writeGeneratedFile(targetDir, file, content);
  }
}
