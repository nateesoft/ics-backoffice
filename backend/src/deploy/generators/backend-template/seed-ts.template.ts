import type { DeployManifest } from '../../manifest/manifest.types';

// Baked at generate time from the deploy manifest — survives `nest build` as ordinary TS source
// (no runtime asset-copy config needed, unlike a JSON file living outside src/). Consumed once by
// SeedService.onModuleInit() on first boot.
export function renderSeedTs(manifest: DeployManifest): string {
  return `// Generated at deploy time — do not edit by hand, it will be overwritten on redeploy.
import type { FieldSchema } from './collections/entities/collection.entity';
import type {
  HttpMethod, CustomEndpointAction, CustomEndpointAuthType, ValidatePasswordMode,
  InputMappingRule, TransformStep, ResponseMappingRule,
} from './custom-endpoints/entities/custom-endpoint.entity';

export interface SeedCollection { id: string; name: string; slug: string; fields: FieldSchema[] }
export interface SeedRecord { id: string; collectionId: string; data: Record<string, unknown> }
export interface SeedCustomEndpoint {
  id: string; name: string; method: HttpMethod; path: string; action: CustomEndpointAction;
  collectionId: string; inputMapping: InputMappingRule[]; transformSteps: TransformStep[];
  responseMapping: ResponseMappingRule[]; validatePasswordMode: ValidatePasswordMode;
  authType: CustomEndpointAuthType; authUsername: string | null; authSecretHash: string | null;
}
export interface SeedActor { actorNodeId: string; name: string; username: string; passwordHash: string }
export interface SeedAccessEntry { nodeId: string; allowedActorNodeIds: string[] }

export interface Seed {
  collections: SeedCollection[];
  records: SeedRecord[];
  customEndpoints: SeedCustomEndpoint[];
  actors: SeedActor[];
  accessMap: SeedAccessEntry[];
}

// Explicitly typed rather than \`as const\` — a project with no actors/collections/endpoints yet
// (a very ordinary case, not an edge case) means one or more of these arrays is empty at generate
// time, and \`as const\` on an empty array literal infers \`readonly []\`, not \`T[]\` — every
// downstream \`for (const x of SEED.foo)\` would then see \`x: never\` and fail to compile.
export const SEED: Seed = ${JSON.stringify({
    collections: manifest.collections,
    records: manifest.records,
    customEndpoints: manifest.customEndpoints,
    actors: manifest.actors,
    accessMap: manifest.accessMap,
  }, null, 2)};
`;
}
