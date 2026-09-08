import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UisGenProject } from '../../entities/uis-gen-project.entity';
import { UisGenSitemap } from '../../entities/uis-gen-sitemap.entity';
import { UisGenActorCredential } from '../../entities/uis-gen-actor-credential.entity';
import { Collection } from '../../collections/entities/collection.entity';
import { RecordEntity } from '../../collections/entities/record.entity';
import { CustomEndpoint, HttpMethod } from '../../custom-endpoints/entities/custom-endpoint.entity';
import type { UisGenActionStep } from './action-step.types';
import type {
  DeployManifest, ManifestAccessEntry, ManifestRouteEntry, ManifestCollection,
  ManifestRecord, ManifestCustomEndpoint, ManifestActor,
} from './manifest.types';

// Mirrors frontend/lib/uisGenTemplates.ts's hasNav flag per templateId — kept as a small local
// lookup rather than importing across the frontend/backend boundary (separate deployables). Falls
// back to `false` for an unrecognized templateId, same as Preview's own `Boolean(template?.hasNav)`.
const TEMPLATE_HAS_NAV: Record<string, boolean> = {
  'sidebar-admin-v1': true,
  'top-nav-saas-v1': true,
  'centered-auth-v1': false,
};

interface SitemapNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
}
interface SitemapEdge {
  source: string;
  target: string;
}

@Injectable()
export class ManifestService {
  constructor(
    @InjectRepository(UisGenProject) private projectRepo: Repository<UisGenProject>,
    @InjectRepository(UisGenSitemap) private sitemapRepo: Repository<UisGenSitemap>,
    @InjectRepository(UisGenActorCredential) private actorCredRepo: Repository<UisGenActorCredential>,
    @InjectRepository(Collection) private collectionsRepo: Repository<Collection>,
    @InjectRepository(RecordEntity) private recordsRepo: Repository<RecordEntity>,
    @InjectRepository(CustomEndpoint) private endpointsRepo: Repository<CustomEndpoint>,
  ) {}

  async build(projectId: string): Promise<DeployManifest> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('UIs Gen project not found');

    const sitemapRow = await this.sitemapRepo.findOne({ where: { projectId } });
    const nodes = (sitemapRow?.nodes ?? []) as SitemapNode[];
    const edges = (sitemapRow?.edges ?? []) as SitemapEdge[];

    const allEndpoints = await this.endpointsRepo.find({ select: { id: true, name: true, method: true, path: true, action: true, collectionId: true, inputMapping: true, transformSteps: true, responseMapping: true, validatePasswordMode: true, authType: true, authUsername: true, authSecretHash: true, createdAt: true } });
    const allCollections = await this.collectionsRepo.find();
    const collectionBySlug = new Map(allCollections.map(c => [c.slug, c]));

    const { dependentCollectionIds, dependentEndpointIds, unresolvedApiUrls } = this.resolveDependencies(
      nodes, allEndpoints, collectionBySlug,
    );

    // Every referenced CustomEndpoint's own collection must travel too, even if no callApi step
    // referenced that collection directly via /api/v1/<slug>.
    for (const epId of dependentEndpointIds) {
      const ep = allEndpoints.find(e => e.id === epId);
      if (ep) dependentCollectionIds.add(ep.collectionId);
    }

    const collections = allCollections.filter(c => dependentCollectionIds.has(c.id));
    const records = collections.length
      ? await this.recordsRepo.find({ where: collections.map(c => ({ collectionId: c.id })) })
      : [];
    const customEndpoints = allEndpoints.filter(e => dependentEndpointIds.has(e.id));

    const actorCreds = await this.actorCredRepo.find({ where: { projectId }, select: { id: true, projectId: true, actorNodeId: true, username: true, passwordHash: true, createdAt: true, updatedAt: true } });
    const actorNodeById = new Map(nodes.filter(n => n.type === 'actor').map(n => [n.id, n]));
    const actors: ManifestActor[] = actorCreds
      .filter(c => actorNodeById.has(c.actorNodeId))
      .map(c => ({
        actorNodeId: c.actorNodeId,
        name: String(actorNodeById.get(c.actorNodeId)?.data?.name ?? c.username),
        username: c.username,
        passwordHash: c.passwordHash,
      }));

    const routeManifest = this.buildRouteManifest(nodes);
    const accessMap = this.buildAccessMap(nodes, edges);

    return {
      project: {
        id: project.id,
        name: project.name,
        navPosition: project.navPosition,
        themeColor: project.themeColor,
        hasNav: TEMPLATE_HAS_NAV[project.templateId] ?? false,
      },
      sitemap: { nodes, edges },
      routeManifest,
      accessMap,
      collections: collections.map(this.toManifestCollection),
      records: records.map(this.toManifestRecord),
      customEndpoints: customEndpoints.map(this.toManifestEndpoint),
      actors,
      unresolvedApiUrls,
    };
  }

  private toManifestCollection(c: Collection): ManifestCollection {
    return { id: c.id, name: c.name, slug: c.slug, fields: c.fields };
  }

  private toManifestRecord(r: RecordEntity): ManifestRecord {
    return { id: r.id, collectionId: r.collectionId, data: r.data };
  }

  private toManifestEndpoint(e: CustomEndpoint): ManifestCustomEndpoint {
    return {
      id: e.id, name: e.name, method: e.method, path: e.path, action: e.action, collectionId: e.collectionId,
      inputMapping: e.inputMapping, transformSteps: e.transformSteps, responseMapping: e.responseMapping,
      validatePasswordMode: e.validatePasswordMode, authType: e.authType, authUsername: e.authUsername,
      authSecretHash: e.authSecretHash,
    };
  }

  private buildRouteManifest(nodes: SitemapNode[]): ManifestRouteEntry[] {
    return nodes
      .filter(n => n.type === 'page' || n.type === 'content')
      .map(n => ({
        nodeId: n.id,
        type: n.type as 'page' | 'content',
        routePath: String(n.data.routePath ?? '/'),
        name: String(n.data.name ?? ''),
      }));
  }

  // Same edge query as Preview's hasAccess() (frontend/app/(dashboard)/uis-gen/[id]/preview/page.tsx)
  // — a page/content node with no incoming edge from an actor node is public; otherwise only the
  // actors with a granting edge may access it. Precomputed once here instead of re-derived per
  // request in the generated app's middleware.
  private buildAccessMap(nodes: SitemapNode[], edges: SitemapEdge[]): ManifestAccessEntry[] {
    const actorNodeIds = new Set(nodes.filter(n => n.type === 'actor').map(n => n.id));
    return nodes
      .filter(n => n.type === 'page' || n.type === 'content')
      .map(n => ({
        nodeId: n.id,
        allowedActorNodeIds: edges.filter(e => e.target === n.id && actorNodeIds.has(e.source)).map(e => e.source),
      }));
  }

  // Walks every page/content/modal node's uiSchema tree collecting action steps (Button's
  // options.actionSteps and the invisible Initial Load marker's own options.actionSteps),
  // recursing into `condition` steps' branches/elseSteps, then resolves each callApi step's
  // apiUrl against real Collection slugs (/api/v1/<slug>) or CustomEndpoint {method,path}
  // (/api/v2/<path>) — mirroring CustomEndpointsService.match()'s own lookup algorithm exactly so
  // resolution never diverges from what the real dispatcher would actually match at runtime.
  private resolveDependencies(
    nodes: SitemapNode[],
    endpoints: CustomEndpoint[],
    collectionBySlug: Map<string, Collection>,
  ): { dependentCollectionIds: Set<string>; dependentEndpointIds: Set<string>; unresolvedApiUrls: string[] } {
    const dependentCollectionIds = new Set<string>();
    const dependentEndpointIds = new Set<string>();
    const unresolvedApiUrls: string[] = [];

    const endpointIndex = new Map<string, CustomEndpoint>();
    for (const e of endpoints) endpointIndex.set(`${e.method}:${e.path}`, e);

    const walkSteps = (steps: UisGenActionStep[] | undefined) => {
      for (const step of steps ?? []) {
        if (step.kind === 'callApi' && step.apiUrl) {
          this.resolveApiUrl(step.apiUrl, step.apiMethod ?? 'GET', collectionBySlug, endpointIndex, dependentCollectionIds, dependentEndpointIds, unresolvedApiUrls);
        }
        if (step.kind === 'condition') {
          for (const branch of step.branches ?? []) walkSteps(branch.steps);
          walkSteps(step.elseSteps);
        }
      }
    };

    const walkUiSchema = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      const n = node as { options?: { actionSteps?: UisGenActionStep[] }; elements?: unknown[] };
      if (n.options?.actionSteps) walkSteps(n.options.actionSteps);
      for (const child of n.elements ?? []) walkUiSchema(child);
    };

    for (const node of nodes) {
      if (node.type !== 'page' && node.type !== 'content' && node.type !== 'modal') continue;
      walkUiSchema(node.data.uiSchema);
    }

    return { dependentCollectionIds, dependentEndpointIds, unresolvedApiUrls };
  }

  private resolveApiUrl(
    apiUrl: string,
    method: HttpMethod,
    collectionBySlug: Map<string, Collection>,
    endpointIndex: Map<string, CustomEndpoint>,
    dependentCollectionIds: Set<string>,
    dependentEndpointIds: Set<string>,
    unresolvedApiUrls: string[],
  ): void {
    const v1Idx = apiUrl.lastIndexOf('/api/v1/');
    const v2Idx = apiUrl.lastIndexOf('/api/v2/');

    if (v1Idx >= 0 && v1Idx >= v2Idx) {
      const rest = apiUrl.slice(v1Idx + '/api/v1/'.length).split(/[/?#]/)[0];
      const collection = collectionBySlug.get(rest);
      if (collection) { dependentCollectionIds.add(collection.id); return; }
      unresolvedApiUrls.push(apiUrl);
      return;
    }

    if (v2Idx >= 0) {
      const rawSubPath = apiUrl.slice(v2Idx + '/api/v2/'.length).split(/[?#]/)[0];
      const path = rawSubPath.toLowerCase().replace(/^\/+|\/+$/g, '');
      const exact = endpointIndex.get(`${method}:${path}`);
      const ID_ACTIONS = ['get', 'update', 'delete'];
      if (exact && !ID_ACTIONS.includes(exact.action)) { dependentEndpointIds.add(exact.id); return; }

      const lastSlash = path.lastIndexOf('/');
      if (lastSlash > 0) {
        const basePath = path.slice(0, lastSlash);
        const withId = endpointIndex.get(`${method}:${basePath}`);
        if (withId && ID_ACTIONS.includes(withId.action)) { dependentEndpointIds.add(withId.id); return; }
      }
      unresolvedApiUrls.push(apiUrl);
      return;
    }

    unresolvedApiUrls.push(apiUrl);
  }
}
