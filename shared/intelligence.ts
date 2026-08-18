export type SupportedProvider = "stripe" | "openai" | "twilio";

export type ProviderSourceKind = "openapi" | "changelog" | "deprecation_notice" | "sdk_release";

export type ChangeSubjectKind =
  | "http_operation"
  | "request_property"
  | "response_property"
  | "enum_value"
  | "sdk_method"
  | "model_identifier";

export type NormalizedChangeType =
  | "added"
  | "removed"
  | "deprecated"
  | "requiredness_changed"
  | "enum_changed"
  | "behavior_changed";

export type BreakingAssessment = "provider_declared" | "structural" | "potential" | "unknown";

export type SourceSnapshot = {
  provider: SupportedProvider;
  sourceKind: ProviderSourceKind;
  sourceUrl: string;
  sourceRef: string;
  retrievedAt: string;
  contentSha256: string;
  contentType: string;
  body: string;
};

export type ChangeSubject = {
  provider: SupportedProvider;
  kind: ChangeSubjectKind;
  canonicalName: string;
  selector: Record<string, string>;
};

export type ProviderChange = {
  externalId: string;
  provider: SupportedProvider;
  changeType: NormalizedChangeType;
  breakingAssessment: BreakingAssessment;
  title: string;
  summary: string;
  effectiveAt?: string;
  source: Pick<SourceSnapshot, "sourceUrl" | "sourceRef" | "retrievedAt" | "contentSha256">;
  sourceLocator: {
    kind: "schema_pointer" | "document_excerpt";
    pointer?: string;
    beforeValue?: string;
    afterValue?: string;
    excerpt?: string;
  };
  subjects: ChangeSubject[];
};

export type DependencyEvidence = {
  packageName: string;
  declaredRange?: string;
  resolvedVersion?: string;
  manifestPath: string;
  lockfilePath?: string;
};

export type CodeEvidenceKind = "import" | "client_construction" | "direct_sdk_call" | "endpoint_literal" | "model_literal";

export type CodeEvidence = {
  kind: CodeEvidenceKind;
  provider: SupportedProvider;
  path: string;
  startLine: number;
  endLine: number;
  symbol?: string;
  subjectCandidate?: string;
  snippet: string;
  snippetSha256: string;
};

export type RepositoryEvidence = {
  repositoryFullName: string;
  commitSha: string;
  defaultBranch: string;
  dependencies: DependencyEvidence[];
  codeEvidence: CodeEvidence[];
};

export type ImpactCandidate = {
  dedupeKey: string;
  change: ProviderChange;
  repository: RepositoryEvidence;
  confidence: number;
  severity: "critical" | "high" | "medium" | "low";
  scoreReasons: string[];
};

export type FindingEvidencePacket = {
  findingId: string;
  change: ProviderChange;
  repository: RepositoryEvidence;
  matcherVersion: string;
  confidence: number;
  severity: "critical" | "high" | "medium" | "low";
  scoreReasons: string[];
};
