import type { DeployManifest } from '../../manifest/manifest.types';

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (exported function must be named `proxy`) — see
// node_modules/next/dist/docs/.../file-conventions/proxy.md, checked against this exact installed
// version per frontend/AGENTS.md's warning that this Next.js release has breaking API changes.
// `config.matcher` must be a build-time-static array (the docs explicitly call out that "dynamic
// values such as variables will be ignored") — so the protected-route list is baked as a literal
// array at generate time, not computed at runtime from imported sitemap data.
//
// This is the real server-side enforcement Preview never had: a page/content node with no actor
// edges is public (not in this list at all); everything else must pass the generated backend's
// GET /auth/verify before it's served.
export function renderProxyTs(manifest: DeployManifest, loginPath: string): string {
  const protectedRoutes = manifest.routeManifest
    .map(r => ({ ...r, allowed: manifest.accessMap.find(a => a.nodeId === r.nodeId)?.allowedActorNodeIds ?? [] }))
    .filter(r => r.allowed.length > 0)
    .map(r => ({ routePath: r.routePath, nodeId: r.nodeId }));

  return `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? 'http://backend:3001';
const LOGIN_PATH = ${JSON.stringify(loginPath)};

const PROTECTED_ROUTES: Record<string, string> = ${JSON.stringify(
    Object.fromEntries(protectedRoutes.map(r => [r.routePath, r.nodeId])),
  )};

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const nodeId = PROTECTED_ROUTES[path];
  if (!nodeId) return NextResponse.next();

  try {
    const res = await fetch(\`\${INTERNAL_API_URL}/auth/verify?nodeId=\${encodeURIComponent(nodeId)}\`, {
      headers: { cookie: request.headers.get('cookie') ?? '' },
    });
    const result = await res.json();
    if (result.allowed) return NextResponse.next();
  } catch {
    // Backend unreachable — fail closed, same as an explicit deny.
  }

  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set('redirect', path);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ${JSON.stringify(protectedRoutes.map(r => r.routePath))},
};
`;
}
