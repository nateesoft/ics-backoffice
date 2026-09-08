import type { FieldSchema } from '../../collections/entities/collection.entity';
import type {
  HttpMethod, CustomEndpointAction, CustomEndpointAuthType, ValidatePasswordMode,
  InputMappingRule, TransformStep, ResponseMappingRule,
} from '../../custom-endpoints/entities/custom-endpoint.entity';

export interface ManifestCollection {
  id: string;
  name: string;
  slug: string;
  fields: FieldSchema[];
}

export interface ManifestRecord {
  id: string;
  collectionId: string;
  data: Record<string, unknown>;
}

export interface ManifestCustomEndpoint {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  action: CustomEndpointAction;
  collectionId: string;
  inputMapping: InputMappingRule[];
  transformSteps: TransformStep[];
  responseMapping: ResponseMappingRule[];
  validatePasswordMode: ValidatePasswordMode;
  authType: CustomEndpointAuthType;
  authUsername: string | null;
  // Carried through unchanged from the source row — the generated backend seeds it verbatim so
  // Basic/Bearer auth behaves identically post-deploy, without needing the original plaintext secret.
  authSecretHash: string | null;
}

export interface ManifestActor {
  actorNodeId: string;
  name: string;
  username: string;
  passwordHash: string;
}

export interface ManifestRouteEntry {
  nodeId: string;
  type: 'page' | 'content';
  routePath: string;
  name: string;
}

export interface ManifestAccessEntry {
  nodeId: string;
  // Empty = public (no actor edges target this node) — same semantics as Preview's hasAccess().
  allowedActorNodeIds: string[];
}

export interface DeployManifest {
  project: {
    id: string;
    name: string;
    navPosition: string;
    themeColor: string;
    hasNav: boolean;
  };
  sitemap: {
    nodes: unknown[];
    edges: unknown[];
  };
  routeManifest: ManifestRouteEntry[];
  accessMap: ManifestAccessEntry[];
  collections: ManifestCollection[];
  records: ManifestRecord[];
  customEndpoints: ManifestCustomEndpoint[];
  actors: ManifestActor[];
  // apiUrl strings from callApi action steps that couldn't be resolved against a real Collection
  // slug / CustomEndpoint {method,path} — surfaced as a warning, not a hard failure (Preview itself
  // never validates these either).
  unresolvedApiUrls: string[];
}
