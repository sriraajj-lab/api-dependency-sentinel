import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getActiveGitHubConnectSession, getLatestChangedProviderPollRun, getRepositoryForUser, getRepositoryOperationalStatus, listLatestProviderSourceSnapshots, listPipelineFindings, listRepositoryFindings, listUserRepositories, persistProvenancePlan, recordRepositoryScanRun, upsertConnectedRepository } from "./db";
import { buildDemoRiskMap, supportedProviders } from "./sentinel";
import { buildPipelinePreviewArtifact, buildPipelinePreviewRiskMap } from "./intelligence/pipelinePreview";
import { scanInstalledTypeScriptRepository } from "./intelligence/githubRepositoryScanner";
import { matchChangeToRepository } from "./intelligence/impactMatcher";
import { buildProvenancePlan } from "./intelligence/provenance";
import { diffOpenAiChangelog } from "./intelligence/openaiAdapter";
import { diffStripeOpenApi, fetchStripeOpenApi } from "./intelligence/stripeAdapter";
import { diffTwilioOpenApi, fetchTwilioOpenApi } from "./intelligence/twilioAdapter";
import type { SourceSnapshot, SupportedProvider } from "../shared/intelligence";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  sentinel: router({
    demoRiskMap: publicProcedure.query(() => buildDemoRiskMap()),
    pipelinePreview: publicProcedure.query(() => buildPipelinePreviewRiskMap()),
    supportedProviders: publicProcedure.query(() => supportedProviders),
    githubConnectStatus: protectedProcedure.query(async ({ ctx }) => {
      const session = await getActiveGitHubConnectSession(ctx.user.id);
      if (!session?.candidatesJson) return { status: "not_authorized" as const, candidates: [] };
      try {
        const candidates = JSON.parse(session.candidatesJson) as Array<{ installationId: string; githubRepositoryId: string; owner: string; name: string; fullName: string; defaultBranch: string }>;
        return { status: "ready" as const, candidates };
      } catch {
        return { status: "not_authorized" as const, candidates: [] };
      }
    }),
    connectGitHubRepository: protectedProcedure
      .input(z.object({ githubRepositoryId: z.string().min(1).max(64) }))
      .mutation(async ({ ctx, input }) => {
        const session = await getActiveGitHubConnectSession(ctx.user.id);
        if (!session?.candidatesJson) throw new TRPCError({ code: "BAD_REQUEST", message: "Authorize GitHub before selecting a repository." });
        let candidates: Array<{ installationId: string; githubRepositoryId: string; owner: string; name: string; fullName: string; defaultBranch: string }>;
        try {
          candidates = JSON.parse(session.candidatesJson) as typeof candidates;
        } catch {
          throw new TRPCError({ code: "BAD_REQUEST", message: "GitHub connection candidates are invalid. Authorize GitHub again." });
        }
        const candidate = candidates.find(item => item.githubRepositoryId === input.githubRepositoryId);
        if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Selected repository is not available through your verified GitHub installation." });
        const repositoryId = await upsertConnectedRepository({
          userId: ctx.user.id,
          githubRepositoryId: candidate.githubRepositoryId,
          owner: candidate.owner,
          name: candidate.name,
          defaultBranch: candidate.defaultBranch,
          installationId: candidate.installationId,
        });
        return { repositoryId, repository: candidate };
      }),
    workspace: protectedProcedure.query(async ({ ctx }) => {
      const repositories = await listUserRepositories(ctx.user.id);
      const selectedRepository = repositories[0];
      if (!selectedRepository) {
        return { mode: "empty" as const, repositories: [], findings: [] };
      }
      const findings = await listRepositoryFindings(selectedRepository.id);
      return { mode: "connected" as const, repositories, findings };
    }),
    repositoryStatus: protectedProcedure.query(async ({ ctx }) => getRepositoryOperationalStatus(ctx.user.id)),
    persistPipelinePreview: protectedProcedure
      .input(z.object({ repositoryId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const repositories = await listUserRepositories(ctx.user.id);
        const repository = repositories.find(item => item.id === input.repositoryId);
        if (!repository) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Repository is not available to the current user." });
        }
        const artifact = buildPipelinePreviewArtifact();
        const findingId = await persistProvenancePlan(input.repositoryId, artifact.plan);
        return { findingId, evidencePacket: artifact.plan.evidencePacket };
      }),
    scanInstalledRepository: protectedProcedure
      .input(z.object({ repositoryId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const repository = await getRepositoryForUser(input.repositoryId, ctx.user.id);
        if (!repository) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Repository is not available to the current user." });
        }
        try {
          const scan = await scanInstalledTypeScriptRepository({ repositoryFullName: `${repository.owner}/${repository.name}` });
          await recordRepositoryScanRun({
            repositoryId: repository.id,
            commitSha: scan.commitSha,
            status: "succeeded",
            fileCount: scan.fileCount,
            dependencyCount: scan.evidence.dependencies.length,
            codeEvidenceCount: scan.evidence.codeEvidence.length,
          });
          return scan;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown GitHub repository scan failure";
          await recordRepositoryScanRun({
            repositoryId: repository.id,
            commitSha: "unavailable",
            status: "failed",
            errorSummary: message,
          });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Read-only repository scan failed." });
        }
      }),
    runAuthenticatedPipeline: protectedProcedure
      .input(z.object({ repositoryId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const repository = await getRepositoryForUser(input.repositoryId, ctx.user.id);
        if (!repository) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Repository is not available to the current user." });
        }
        try {
          const scan = await scanInstalledTypeScriptRepository({ repositoryFullName: `${repository.owner}/${repository.name}` });
          await recordRepositoryScanRun({
            repositoryId: repository.id,
            commitSha: scan.commitSha,
            status: "succeeded",
            fileCount: scan.fileCount,
            dependencyCount: scan.evidence.dependencies.length,
            codeEvidenceCount: scan.evidence.codeEvidence.length,
          });
          const status = await getRepositoryOperationalStatus(ctx.user.id);
          const installedPackages = new Set(scan.evidence.dependencies.map(dependency => dependency.packageName.toLowerCase()));
          const monitoredProviders = status.providerPolls
            .filter(poll => installedPackages.has(poll.provider.toLowerCase()))
            .map(poll => ({ provider: poll.provider, lastStatus: poll.lastStatus, lastSuccessAt: poll.lastSuccessAt }));
          const changedProviders: string[] = [];
          const persistedFindingIds: number[] = [];
          const matchingNotes: string[] = [];
          const supportedMonitoredProviders = monitoredProviders.map(item => item.provider).filter((provider): provider is SupportedProvider =>
            provider === "stripe" || provider === "openai" || provider === "twilio"
          );
          for (const provider of supportedMonitoredProviders) {
            try {
              const revision = await getLatestChangedProviderPollRun(provider);
              if (!revision) continue;
              changedProviders.push(provider);
              let changes;
              if (provider === "openai") {
                const snapshots = await listLatestProviderSourceSnapshots(provider, 2);
                if (snapshots.length < 2) {
                  matchingNotes.push(`${provider} has a changed state but needs one more retained source revision before deterministic historical matching can begin.`);
                  continue;
                }
                const [nextRow, priorRow] = snapshots;
                const toSnapshot = (row: typeof nextRow): SourceSnapshot => ({
                  provider,
                  sourceKind: row.sourceKind as SourceSnapshot["sourceKind"],
                  sourceUrl: row.sourceUrl,
                  sourceRef: row.sourceRef,
                  contentSha256: row.contentSha256,
                  contentType: row.contentType,
                  body: row.body,
                  retrievedAt: row.retrievedAt.toISOString(),
                });
                changes = diffOpenAiChangelog(toSnapshot(priorRow), toSnapshot(nextRow));
              } else {
                if (!revision?.priorCommitSha || !revision.nextCommitSha || revision.priorCommitSha === revision.nextCommitSha) {
                  matchingNotes.push(`${provider} has no distinct immutable source revisions available for historical matching yet.`);
                  continue;
                }
                const [prior, next] = provider === "stripe"
                  ? await Promise.all([fetchStripeOpenApi(revision.priorCommitSha), fetchStripeOpenApi(revision.nextCommitSha)])
                  : await Promise.all([fetchTwilioOpenApi(revision.priorCommitSha), fetchTwilioOpenApi(revision.nextCommitSha)]);
                changes = provider === "stripe" ? diffStripeOpenApi(prior, next) : diffTwilioOpenApi(prior, next);
              }
              for (const change of changes) {
                const candidate = matchChangeToRepository(change, scan.evidence);
                if (!candidate) continue;
                persistedFindingIds.push(await persistProvenancePlan(repository.id, buildProvenancePlan(candidate, `${provider}-retained-source-diff-v1`)));
              }
            } catch (error) {
              matchingNotes.push(error instanceof Error ? `${provider}: ${error.message}` : `${provider}: source-backed matching was unavailable.`);
            }
          }
          return {
            scan,
            monitoredProviders,
            changedProviders,
            findingsCreated: persistedFindingIds.length,
            matchingNote: matchingNotes.length > 0 ? matchingNotes.join(" ") : undefined,
            nextStep: persistedFindingIds.length > 0
              ? `${persistedFindingIds.length} source-backed impact finding${persistedFindingIds.length === 1 ? "" : "s"} was refreshed for reviewer review.`
              : changedProviders.length > 0
                ? "Provider change state is available for reviewer matching; no source-backed impact finding was fabricated during this run."
                : "Repository evidence and current provider state are synchronized; no new provider change is ready for matching.",
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown GitHub repository scan failure";
          await recordRepositoryScanRun({
            repositoryId: repository.id,
            commitSha: "unavailable",
            status: "failed",
            errorSummary: message,
          });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Read-only repository analysis failed." });
        }
      }),
    persistedPipelineWorkspace: protectedProcedure.query(async ({ ctx }) => {
      const repositories = await listUserRepositories(ctx.user.id);
      const selectedRepository = repositories[0];
      if (!selectedRepository) return { mode: "empty" as const, repositories: [], findings: [] };
      const findings = await listPipelineFindings(selectedRepository.id);
      return {
        mode: "connected" as const,
        repositories,
        findings: findings.map(finding => {
          try {
            return { ...finding, evidencePacket: JSON.parse(finding.evidencePacketJson) as unknown };
          } catch {
            return { ...finding, evidencePacket: null };
          }
        }),
      };
    }),
    setDemoFindingStatus: publicProcedure
      .input(z.object({ id: z.string(), status: z.enum(["needs_review", "triaged", "ignored", "resolved"]) }))
      .mutation(({ input }) => ({ ...input, updated: true })),
  }),
});

export type AppRouter = typeof appRouter;
