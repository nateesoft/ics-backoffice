// Turns a designer-typed routePath (e.g. "/product", "/") into Next.js App Router folder
// segments. The sitemap model has no real dynamic-segment support (Preview itself only ever does
// exact string matching on routePath — see hasAccess()/the preview page's route scan), so this
// intentionally does not attempt `:param`-style dynamic routes; any such characters are just
// sanitized into literal folder-name text, matching Preview's own flat-string-match limitation.
export function routePathToAppDirSegments(routePath: string): string[] {
  const trimmed = (routePath || '/').trim();
  if (trimmed === '' || trimmed === '/') return [];
  return trimmed
    .split('/')
    .filter(Boolean)
    .map(seg => seg.replace(/[^a-zA-Z0-9\-_.]/g, '-'));
}

export function routePathToAppFile(routePath: string): string {
  const segments = routePathToAppDirSegments(routePath);
  return segments.length === 0 ? 'app/page.tsx' : `app/${segments.join('/')}/page.tsx`;
}
