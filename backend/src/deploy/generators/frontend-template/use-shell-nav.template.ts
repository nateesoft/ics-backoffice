// New (no direct Preview equivalent) but logically identical to Preview's own nav-link
// computation (`contentNodes.filter(n => hasAccess(n.id, actorId, sitemap))`), adapted for a real
// session: fetches the current actor once via GET /auth/me instead of reading a design-time
// dropdown's local state.
export function renderUseShellNavTs(): string {
  return `'use client';
import { useEffect, useState } from 'react';
import { ROUTE_MANIFEST, ACCESS_MAP } from './sitemap-data';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface ShellNavLink { path: string; label: string }

export function useShellNav() {
  const [actorNodeId, setActorNodeId] = useState<string | null>(null);

  useEffect(() => {
    fetch(\`\${API_BASE}/auth/me\`, { credentials: 'include' })
      .then(res => (res.ok ? res.json() : null))
      .then(actor => setActorNodeId(actor?.actorNodeId ?? null))
      .catch(() => setActorNodeId(null));
  }, []);

  const navLinks: ShellNavLink[] = ROUTE_MANIFEST
    .filter(r => r.type === 'content')
    .filter(r => {
      const allowed = ACCESS_MAP.find(a => a.nodeId === r.nodeId)?.allowedActorNodeIds ?? [];
      if (allowed.length === 0) return true;
      return actorNodeId ? allowed.includes(actorNodeId) : false;
    })
    .map(r => ({ path: r.routePath, label: r.name || r.routePath }));

  return { navLinks, actorNodeId };
}
`;
}
