import { CheckCircle2, ChevronRight, Github, Loader2, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function GitHubConnect() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: false });
  const status = trpc.sentinel.githubConnectStatus.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const connect = trpc.sentinel.connectGitHubRepository.useMutation({
    onSuccess: () => window.location.assign("/workspace/live"),
  });

  const beginAuthorization = () => window.location.assign("/api/github/connect/start");

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#101629] text-[#d8deec]"><div className="flex items-center gap-3 font-mono-ui text-xs uppercase tracking-[.15em]"><Loader2 className="animate-spin text-[#f1c85b]" size={18} /> Checking your workspace</div></div>;
  }

  return (
    <div className="min-h-screen bg-[#101629] text-[#f7f8fc]">
      <header className="border-b border-white/10 bg-[#101629]/95"><div className="mx-auto flex h-[70px] max-w-5xl items-center justify-between px-5 lg:px-8"><a href="/" className="flex items-center gap-2 text-sm font-bold"><Github size={18} className="text-[#f1c85b]" /> API Dependency Sentinel</a><a href="/workspace" className="text-xs font-semibold text-[#b8c0d5] hover:text-white">View demo</a></div></header>
      <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8 lg:py-16">
        <section className="grid gap-8 rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_84%_12%,rgba(106,184,255,.13),transparent_32%),#171f38] p-6 shadow-2xl sm:p-10 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.15em] text-[#f1c85b]"><ShieldCheck size={14} /> Read-only connection</div>
            <h1 className="mt-5 max-w-xl text-4xl font-bold leading-[.95] tracking-[-.06em] sm:text-5xl">Choose the repository Sentinel can watch.</h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#b8c0d5]">GitHub authorization is used only to verify the installations you can access. Sentinel then lists repositories already granted to its GitHub App, and you explicitly select one before a connection is recorded.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-[#101629]/65 p-4"><LockKeyhole size={17} className="text-[#6ab8ff]" /><p className="mt-3 text-sm font-bold">No repository writes</p><p className="mt-1 text-xs leading-5 text-[#98a5c0]">The first release requests only repository contents read access.</p></div><div className="rounded-xl border border-white/10 bg-[#101629]/65 p-4"><CheckCircle2 size={17} className="text-[#64d6a1]" /><p className="mt-3 text-sm font-bold">You approve the selection</p><p className="mt-1 text-xs leading-5 text-[#98a5c0]">A repository is never connected from a redirect parameter alone.</p></div></div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#101629]/80 p-5 sm:p-6">
            {!isAuthenticated ? <div className="flex h-full flex-col justify-center"><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#f1c85b]">Step 1 of 2</p><h2 className="mt-3 text-2xl font-bold tracking-[-.04em]">Continue with GitHub.</h2><p className="mt-3 text-sm leading-6 text-[#aeb8cf]">GitHub verifies the installations you can access. Sentinel creates a private workspace session only after that server-side verification succeeds.</p><button onClick={beginAuthorization} className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[#f1c85b] px-4 py-3 text-sm font-bold text-[#101629] transition-transform hover:bg-[#f7d778] active:scale-[.97]"><Github size={17} /> Continue with GitHub</button></div> : status.isLoading ? <div className="grid h-full place-items-center text-sm text-[#aeb8cf]"><Loader2 className="animate-spin text-[#f1c85b]" size={20} /></div> : status.data?.status !== "ready" ? <div className="flex h-full flex-col justify-center"><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#f1c85b]">GitHub verification required</p><h2 className="mt-3 text-2xl font-bold tracking-[-.04em]">Authorize GitHub.</h2><p className="mt-3 text-sm leading-6 text-[#aeb8cf]">GitHub confirms the installations you can manage, then returns you here to choose a repository. No token is shown or saved in your browser.</p><button onClick={beginAuthorization} className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-[#101629] transition-transform hover:bg-[#eef2fb] active:scale-[.97]"><Github size={17} /> Continue to GitHub</button>{status.error && <button onClick={() => status.refetch()} className="mt-4 inline-flex items-center justify-center gap-2 text-xs font-semibold text-[#b8c0d5] hover:text-white"><RefreshCw size={13} /> Retry connection status</button>}</div> : <div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#64d6a1]">Verified GitHub access</p><h2 className="mt-3 text-2xl font-bold tracking-[-.04em]">Select one repository.</h2><p className="mt-3 text-sm leading-6 text-[#aeb8cf]">Only repositories returned through your verified GitHub App installation appear below.</p><div className="mt-5 max-h-[330px] space-y-2 overflow-y-auto pr-1">{status.data.candidates.map(candidate => <button key={candidate.githubRepositoryId} onClick={() => connect.mutate({ githubRepositoryId: candidate.githubRepositoryId })} disabled={connect.isPending} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#171f38] px-4 py-3 text-left transition-colors hover:border-[#f1c85b]/60 hover:bg-white/5 disabled:cursor-wait"><span><span className="block text-sm font-bold text-white">{candidate.fullName}</span><span className="mt-1 block font-mono-ui text-[10px] uppercase tracking-[.1em] text-[#9da8c1]">{candidate.defaultBranch} · read-only</span></span>{connect.isPending ? <Loader2 size={16} className="animate-spin text-[#f1c85b]" /> : <ChevronRight size={16} className="text-[#f1c85b]" />}</button>)}</div>{connect.error && <p className="mt-4 text-xs leading-5 text-[#ffb1a8]">{connect.error.message}</p>}</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
