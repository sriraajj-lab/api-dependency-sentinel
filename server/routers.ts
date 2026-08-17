import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { listRepositoryFindings, listUserRepositories } from "./db";
import { buildDemoRiskMap, supportedProviders } from "./sentinel";
import { z } from "zod";

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
    setDemoFindingStatus: publicProcedure
      .input(z.object({ id: z.string(), status: z.enum(["needs_review", "triaged", "ignored", "resolved"]) }))
      .mutation(({ input }) => ({ ...input, updated: true })),
  }),
});

export type AppRouter = typeof appRouter;
