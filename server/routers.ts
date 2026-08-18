import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getRepositoryForUser, listPipelineFindings, listRepositoryFindings, listUserRepositories, persistProvenancePlan, recordRepositoryScanRun } from "./db";
import { buildDemoRiskMap, supportedProviders } from "./sentinel";
import { buildPipelinePreviewArtifact, buildPipelinePreviewRiskMap } from "./intelligence/pipelinePreview";
import { scanInstalledTypeScriptRepository } from "./intelligence/githubRepositoryScanner";
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
    workspace: protectedProcedure.query(async ({ ctx }) => {
      const repositories = await listUserRepositories(ctx.user.id);
      const selectedRepository = repositories[0];
      if (!selectedRepository) {
        return { mode: "empty" as const, repositories: [], findings: [] };
      }
      const findings = await listRepositoryFindings(selectedRepository.id);
      return { mode: "connected" as const, repositories, findings };
    }),
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
