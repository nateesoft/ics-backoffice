'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { uisGenProjectStore } from '@/lib/uisGenProjectStore';
import { uisGenSitemapStore } from '@/lib/uisGenSitemapStore';
import { getUisGenTemplate } from '@/lib/uisGenTemplates';
import ShellFrame from '@/components/uis-gen/ShellFrame';
import UisGenLivePreview from '@/components/uis-gen/UisGenLivePreview';
import type {
  UisGenActorNodeData, UisGenPageNodeData, UisGenContentNodeData, UisGenProject, UisGenSitemapState,
} from '@/types/uisGen';

const GUEST_ACTOR_ID = '__guest__';

function hasAccess(nodeId: string, actorId: string, sitemap: UisGenSitemapState): boolean {
  const grantedEdges = sitemap.edges.filter(e => e.target === nodeId && sitemap.nodes.some(n => n.id === e.source && n.type === 'actor'));
  if (grantedEdges.length === 0) return true; // no actor edges = public
  if (actorId === GUEST_ACTOR_ID) return false;
  return grantedEdges.some(e => e.source === actorId);
}

// Page/content nodes that are NOT the target of an edge from another page/content node — the
// entry point(s) of the flow, ignoring access. A "page -> content" chain makes content a
// *downstream* screen, so only the page is a root.
function findFlowRoots(sitemap: UisGenSitemapState) {
  const pageContentIds = new Set(sitemap.nodes.filter(n => n.type === 'page' || n.type === 'content').map(n => n.id));
  const downstreamIds = new Set(
    sitemap.edges.filter(e => pageContentIds.has(e.source) && pageContentIds.has(e.target)).map(e => e.target)
  );
  return sitemap.nodes.filter(n => pageContentIds.has(n.id) && !downstreamIds.has(n.id));
}

// The actor to pre-select when Preview first opens. Defaulting to Guest unconditionally meant an
// actor-gated flow (e.g. actor -> page -> content, where only that actor can reach the page) would
// silently skip the page — Guest can't see it, so entry fell through to the next accessible node.
// Instead, default to whichever actor is granted access to the flow's own root screen (preferring
// a 'page' root, matching computeEntryPath's own preference), so the intended starting actor's
// flow actually plays out. Falls back to Guest when the root is public or there's no flow at all.
function computeDefaultActor(sitemap: UisGenSitemapState): string {
  const roots = findFlowRoots(sitemap);
  const rootCandidate = roots.find(n => n.type === 'page') ?? roots[0];
  if (!rootCandidate) return GUEST_ACTOR_ID;
  const grantingEdge = sitemap.edges.find(
    e => e.target === rootCandidate.id && sitemap.nodes.some(n => n.id === e.source && n.type === 'actor')
  );
  return grantingEdge ? grantingEdge.source : GUEST_ACTOR_ID;
}

// Preview's landing route for a given actor — resolved from the sitemap's own flow (edges), not
// an arbitrary "first content node" guess: downstream screens (see findFlowRoots) are excluded
// from the candidate set, and among the remaining roots, a plain "page" node wins over a
// "content" node since a page (e.g. a login/gate screen) is meant to be seen before the app shell.
function computeEntryPath(sitemap: UisGenSitemapState, actorId: string): string {
  const routable = sitemap.nodes.filter(n => (n.type === 'page' || n.type === 'content') && hasAccess(n.id, actorId, sitemap));
  if (routable.length === 0) return '/';

  const rootIds = new Set(findFlowRoots(sitemap).map(n => n.id));
  const roots = routable.filter(n => rootIds.has(n.id));
  const candidates = roots.length > 0 ? roots : routable;

  const chosen = candidates.find(n => n.type === 'page') ?? candidates[0];
  return (chosen.data as UisGenPageNodeData | UisGenContentNodeData).routePath || '/';
}

export default function UisGenPreviewPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [project, setProject] = useState<UisGenProject | null | undefined>(undefined);
  const [sitemap, setSitemap] = useState<UisGenSitemapState>({ nodes: [], edges: [] });
  const [actorId, setActorId] = useState<string>(GUEST_ACTOR_ID);
  const [path, setPath] = useState('/');
  const [dataByNode, setDataByNode] = useState<Record<string, Record<string, unknown>>>({});

  useEffect(() => {
    setProject(uisGenProjectStore.getById(projectId));
    const loadedSitemap = uisGenSitemapStore.getByProjectId(projectId);
    setSitemap(loadedSitemap);
    const defaultActor = computeDefaultActor(loadedSitemap);
    setActorId(defaultActor);
    setPath(computeEntryPath(loadedSitemap, defaultActor));
  }, [projectId]);

  function handleActorChange(nextActorId: string) {
    setActorId(nextActorId);
    setPath(computeEntryPath(sitemap, nextActorId));
  }

  const actors = useMemo(() => sitemap.nodes.filter(n => n.type === 'actor'), [sitemap.nodes]);
  const contentNodes = useMemo(() => sitemap.nodes.filter(n => n.type === 'content'), [sitemap.nodes]);
  const pageNodes = useMemo(() => sitemap.nodes.filter(n => n.type === 'page'), [sitemap.nodes]);

  const nodeRefs = useMemo(() => sitemap.nodes.map(n => ({ id: n.id, type: n.type, data: n.data as unknown as Record<string, unknown> })), [sitemap.nodes]);

  function getNodeData(nodeId: string, initial: Record<string, unknown>): Record<string, unknown> {
    return dataByNode[nodeId] ?? initial;
  }
  function setNodeData(nodeId: string, data: Record<string, unknown>) {
    setDataByNode(prev => ({ ...prev, [nodeId]: data }));
  }

  if (project === undefined) return null;
  if (project === null) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">ไม่พบ Project นี้</p>
        <Link href="/uis-gen" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">← กลับไปหน้า UIs Gen</Link>
      </div>
    );
  }

  const template = getUisGenTemplate(project.templateId);
  const matchedPage = pageNodes.find(n => (n.data as UisGenPageNodeData).routePath === path);
  const matchedContent = !matchedPage ? contentNodes.find(n => (n.data as UisGenContentNodeData).routePath === path) : undefined;

  const navLinks = contentNodes
    .filter(n => hasAccess(n.id, actorId, sitemap))
    .map(n => ({ path: (n.data as UisGenContentNodeData).routePath, label: (n.data as UisGenContentNodeData).name || (n.data as UisGenContentNodeData).routePath }));

  const toolbar = (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-800 text-white text-xs flex-shrink-0">
      <Link href={`/uis-gen/${projectId}`} className="text-slate-300 hover:text-white">← กลับไป Sitemap</Link>
      <span className="text-slate-500">|</span>
      <span className="font-mono text-slate-300">{path}</span>
      <div className="flex-1" />
      <label className="flex items-center gap-1.5">
        <span className="text-slate-400">Actor:</span>
        <select
          value={actorId}
          onChange={e => handleActorChange(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-white"
        >
          <option value={GUEST_ACTOR_ID}>Guest (ไม่ระบุ)</option>
          {actors.map(a => <option key={a.id} value={a.id}>{(a.data as UisGenActorNodeData).name || 'ยังไม่ตั้งชื่อ'}</option>)}
        </select>
      </label>
    </div>
  );

  function renderDenied() {
    return (
      <div className="flex-1 flex items-center justify-center p-10 text-center">
        <div>
          <p className="text-4xl mb-2">🔒</p>
          <p className="text-sm font-semibold text-slate-700">Access Denied</p>
          <p className="text-xs text-slate-400 mt-1">Actor ปัจจุบันไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  function renderNotFound() {
    return (
      <div className="flex-1 flex items-center justify-center p-10 text-center">
        <div>
          <p className="text-sm font-semibold text-slate-700">ไม่พบหน้าสำหรับ path นี้</p>
          <p className="text-xs font-mono text-slate-400 mt-1">{path}</p>
        </div>
      </div>
    );
  }

  let body: React.ReactNode;

  if (matchedPage) {
    const pageData = matchedPage.data as UisGenPageNodeData;
    body = hasAccess(matchedPage.id, actorId, sitemap) ? (
      <div className="flex-1 overflow-auto p-6">
        <UisGenLivePreview
          schema={pageData.schema}
          uiSchema={pageData.uiSchema}
          data={getNodeData(matchedPage.id, pageData.data)}
          onDataChange={d => setNodeData(matchedPage.id, d)}
          initialData={pageData.data}
          nodes={nodeRefs}
          onNavigate={setPath}
        />
      </div>
    ) : renderDenied();
  } else if (matchedContent) {
    const contentData = matchedContent.data as UisGenContentNodeData;
    body = (
      <ShellFrame
        hasNav={Boolean(template?.hasNav)}
        navPosition={project.navPosition}
        themeColor={project.themeColor}
        projectName={project.name}
        navLinks={navLinks}
        activePath={path}
        onNavigate={setPath}
      >
        {hasAccess(matchedContent.id, actorId, sitemap) ? (
          <UisGenLivePreview
            schema={contentData.schema}
            uiSchema={contentData.uiSchema}
            data={getNodeData(matchedContent.id, contentData.data)}
            onDataChange={d => setNodeData(matchedContent.id, d)}
            initialData={contentData.data}
            nodes={nodeRefs}
            onNavigate={setPath}
          />
        ) : renderDenied()}
      </ShellFrame>
    );
  } else {
    body = (
      <ShellFrame hasNav={Boolean(template?.hasNav)} navPosition={project.navPosition} themeColor={project.themeColor} projectName={project.name} navLinks={navLinks} activePath={path} onNavigate={setPath}>
        {renderNotFound()}
      </ShellFrame>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white">
      {toolbar}
      <div className="flex-1 overflow-hidden flex flex-col">{body}</div>
    </div>
  );
}
