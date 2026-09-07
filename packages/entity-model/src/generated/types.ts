/* Generated from JSON Schema draft-07 by json-schema-to-typescript 16.0.0.
 * Normalized with pinned Oxfmt. Run yarn schemas:generate; do not edit. */

/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "Audience".
 */
export type Audience = "local" | "private-owner" | "private-group" | "public";
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "ViewType".
 */
export type ViewType = "label" | "tile" | "card" | "full";
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "RenderContext".
 */
export type RenderContext = "navigation" | "collection" | "relationship" | "search" | "detail";
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "StableId".
 */
export type StableId = string;
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "Timestamp".
 */
export type Timestamp = string;
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "Digest".
 */
export type Digest = string;
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "RelativePath".
 */
export type RelativePath = string;
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "RelationshipKind".
 */
export type RelationshipKind = "related-to" | "depends-on" | "supersedes";
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "Source".
 */
export type Source = {
  id: StableId;
  title: string;
  publisher: string;
  sourceType:
    | "primary-documentation"
    | "source-code"
    | "release-notes"
    | "package-metadata"
    | "owner-material";
  url?: string;
  locator?: RelativePath;
  access: "public" | "private" | "restricted";
  retrievedAt: Timestamp;
  revision?: string;
  fingerprint?: Digest;
} & Source1;
export type Source1 = {
  [k: string]: unknown;
};

export interface TrackerContracts {}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "LabelViewModel".
 */
export interface LabelViewModel {
  title: string;
  href: string;
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "TileViewModel".
 */
export interface TileViewModel {
  title: string;
  summary: string;
  href: string;
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "CardViewModel".
 */
export interface CardViewModel {
  title: string;
  summary: string;
  href: string;
  /**
   * @maxItems 32
   */
  badges: string[];
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "FullViewModel".
 */
export interface FullViewModel {
  title: string;
  summary: string;
  href: string;
  body: string;
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "ViewModels".
 */
export interface ViewModels {
  label?: LabelViewModel;
  tile?: TileViewModel;
  card?: CardViewModel;
  full?: FullViewModel;
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "ContextOverrides".
 */
export interface ContextOverrides {
  navigation?: ViewType;
  collection?: ViewType;
  relationship?: ViewType;
  search?: ViewType;
  detail?: ViewType;
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "ResolvedContexts".
 */
export interface ResolvedContexts {
  navigation: ViewType;
  collection: ViewType;
  relationship: ViewType;
  search: ViewType;
  detail: ViewType;
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "SiteEntity".
 */
export interface SiteEntity {
  id: StableId;
  dataType: string;
  dataVersion: number;
  title: string;
  summary: string;
  route: string;
  primaryTopicId: StableId;
  tags: string[];
  relationships: {
    kind: RelationshipKind;
    targetId: StableId;
    viewType: ViewType;
  }[];
  citations: {
    title: string;
    url: string;
  }[];
  lastVerifiedAt?: Timestamp;
  view: {
    defaultType: ViewType;
    byContext: ResolvedContexts;
  };
  viewModels: ViewModels;
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "TopicView".
 */
export interface TopicView {
  id: StableId;
  title: string;
  description: string;
  order: number;
  parentId?: StableId;
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "SearchDocument".
 */
export interface SearchDocument {
  id: StableId;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  primaryTopicId: StableId;
  route: string;
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "SiteManifest".
 */
export interface SiteManifest {
  schemaVersion: 1;
  audience: Audience;
  basePath: string;
  contentDigest: Digest;
  deployable: boolean;
  taxonomy: TopicView[];
  entities: SiteEntity[];
  searchDocuments: SearchDocument[];
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "Sensitivity".
 */
export interface Sensitivity {
  classification: "public" | "private" | "restricted";
  containsPersonalData: boolean;
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "Publication".
 */
export interface Publication {
  eligibility: Audience;
  requestedTargets: Audience[];
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "MarkdownData".
 */
export interface MarkdownData {
  bodyPath: RelativePath;
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "Claim".
 */
export interface Claim {
  id: StableId;
  basis: "observed" | "inferred" | "recommended" | "confirmed";
  statement: string;
  /**
   * @minItems 1
   */
  sourceIds: [StableId, ...StableId[]];
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "Entity".
 */
export interface Entity {
  schemaVersion: 1;
  id: StableId;
  dataType: "markdown";
  dataVersion: 1;
  title: string;
  summary: string;
  lifecycle: "draft" | "active" | "archived";
  taxonomy: {
    primaryTopicId: StableId;
    relatedTopicIds: StableId[];
    /**
     * @maxItems 32
     */
    tags: StableId[];
  };
  /**
   * @maxItems 200
   */
  relationships: {
    kind: RelationshipKind;
    targetId: StableId;
    viewType?: ViewType;
  }[];
  view: {
    defaultType?: ViewType;
    /**
     * @minItems 1
     */
    permittedTypes: [ViewType, ...ViewType[]];
    contextOverrides?: ContextOverrides;
  };
  data: MarkdownData;
  provenance: {
    /**
     * @maxItems 200
     */
    sources: Source[];
    /**
     * @maxItems 500
     */
    claims: Claim[];
  };
  sensitivity: Sensitivity;
  capturePolicy: "link-only" | "summary-allowed" | "quotation-allowed";
  publication: Publication;
  ownershipPolicyId: StableId;
  refresh: {
    workflow: "manual" | "research-topic";
    cadence: string;
    stateId: StableId;
  };
  timestamps: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
  };
  review: {
    lastReviewedAt?: Timestamp;
    nextReviewAt: Timestamp;
  };
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "TaxonomyNode".
 */
export interface TaxonomyNode {
  id: StableId;
  title: string;
  slug: StableId;
  description: string;
  order: number;
  parentId?: StableId;
  sensitivity: Sensitivity;
  publication: Publication;
  retiredIds?: StableId[];
  retiredSlugs?: StableId[];
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "Taxonomy".
 */
export interface Taxonomy {
  schemaVersion: 1;
  /**
   * @maxItems 1000
   */
  nodes: TaxonomyNode[];
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "ResearchState".
 */
export interface ResearchState {
  schemaVersion: 1;
  entityId: StableId;
  objective: string;
  status: "active" | "paused" | "blocked";
  /**
   * @maxItems 100
   */
  completedSubtopics: string[];
  /**
   * @maxItems 100
   */
  remainingSubtopics: string[];
  /**
   * @maxItems 200
   */
  sourceCursors: {
    sourceId: StableId;
    fingerprint: Digest;
  }[];
  lastAttemptAt?: Timestamp;
  lastAttemptOutcome?: "succeeded" | "no-change" | "partial" | "blocked" | "failed";
  lastSuccessfulRetrievalAt?: Timestamp;
  lastVerifiedAt?: Timestamp;
  lastReviewedAt?: Timestamp;
  /**
   * @maxItems 100
   */
  openQuestions: string[];
  /**
   * @maxItems 100
   */
  contradictions: string[];
  retryAfter?: Timestamp;
  nextAction: string;
  nextHumanReviewAt: Timestamp;
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "SourcesManifest".
 */
export interface SourcesManifest {
  schemaVersion: 1;
  entityId: StableId;
  sources: Source[];
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "RunOutcome".
 */
export interface RunOutcome {
  schemaVersion: 1;
  runId: StableId;
  workflow: "research-topic" | "refine-website" | "organize-site" | "reconcile-content";
  baseRevision: string;
  requestKey: Digest;
  scopeIds: StableId[];
  sourceEvidence: {
    sourceId: StableId;
    retrievedAt: Timestamp;
    fingerprint: Digest;
  }[];
  changedEntityIds: StableId[];
  validation: string;
  startedAt: Timestamp;
  endedAt: Timestamp;
  outcome: "succeeded" | "no-change" | "partial" | "blocked" | "failed";
  reviewItems: string[];
  continuation: string;
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "OwnershipPolicy".
 */
export interface OwnershipPolicy {
  schemaVersion: 1;
  /**
   * @minItems 1
   */
  policies: [
    {
      id: StableId;
      entityPointers: (
        | "/summary"
        | "/provenance"
        | "/relationships"
        | "/timestamps/updatedAt"
        | "/review"
      )[];
      managedRegions: StableId[];
      researchFiles: ("state.yaml" | "sources.yaml" | "evidence.md" | "runs")[];
    },
    ...{
      id: StableId;
      entityPointers: (
        | "/summary"
        | "/provenance"
        | "/relationships"
        | "/timestamps/updatedAt"
        | "/review"
      )[];
      managedRegions: StableId[];
      researchFiles: ("state.yaml" | "sources.yaml" | "evidence.md" | "runs")[];
    }[],
  ];
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "PublicationPolicy".
 */
export interface PublicationPolicy {
  schemaVersion: 1;
  policyVersion: number;
  networkPublicationEnabled: false;
  reviewers: string[];
  destinations: {
    id: StableId;
    audience: "private-group" | "public";
  }[];
  publicSourceHosts: string[];
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "PublicationApproval".
 */
export interface PublicationApproval {
  schemaVersion: 1;
  target: "private-group" | "public";
  deploymentId: StableId;
  basePath: string;
  entityIds: StableId[];
  contentDigest: Digest;
  taxonomyDigest: Digest;
  citationsDigest: Digest;
  assetsDigest: Digest;
  closureDigest: Digest;
  policyVersion: number;
  reviewer: string;
  approvedAt: Timestamp;
  expiresAt?: Timestamp;
}
/**
 * This interface was referenced by `TrackerContracts`'s JSON-Schema
 * via the `definition` "Proposal".
 */
export interface Proposal {
  schemaVersion: 1;
  runId: StableId;
  workflow: "research-topic" | "refine-website" | "organize-site" | "reconcile-content";
  baseRevision: string;
  requestKey: Digest;
  /**
   * @minItems 1
   */
  scopeIds: [StableId, ...StableId[]];
  asOf: Timestamp;
  policyVersion: number;
  outcome: "succeeded" | "no-change" | "partial" | "blocked" | "failed";
  /**
   * @maxItems 100
   */
  changes: {
    path: RelativePath;
    expectedHash: Digest | null;
    proposedPath: RelativePath;
  }[];
}
