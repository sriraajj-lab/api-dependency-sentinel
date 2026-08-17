import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  FileCode2,
  Filter,
  Github,
  GitPullRequest,
  ListChecks,
  Loader2,
  Radar,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type RiskStatus = "all" | "needs_review" | "triaged";

const statusLabel = { needs_review: "Needs review", triaged: "Triaged", ignored: "Ignored" } as const;
const severityClasses = {
  critical: "border-[#ff6b6b]/30 bg-[#ff6b6b]/10 text-[#ff9999]",
  high: "border-[#f1c85b]/35 bg-[#f1c85b]/10 text-[#f5d673]",
  medium: "border-[#6ab8ff]/30 bg-[#6ab8ff]/10 text-[#8bc8ff]",
  low: "border-[#6ddaa7]/30 bg-[#6ddaa7]/10 text-[#8ce8bc]",
};

export default function Workspace() {
  const { data, isLoading, error, refetch } = trpc.sentinel.demoRiskMap.useQuery();
  const updateStatus = trpc.sentinel.setDemoFindingStatus.useMutation();
  const [filter, setFilter] = useState<RiskStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleFindings = useMemo(() => {
    if (!data) return [];
    return data.findings.filter((finding) => filter === "all" || finding.status === filter);
  }, [data, filter]);

  const selected = data?.findings.find((finding) => finding.id === selectedId) ?? visibleFindings[0];

  const handleDemoAction = (action: "issue" | "test" | "ignore") => {
    if (!selected) return;
    const status = action === "ignore" ? "ignored" : "triaged";
    updateStatus.mutate({ id: selected.id, status });
    toast.success(action === "issue" ? "Demo GitHub issue prepared" : action === "test" ? "Demo test plan prepared" : "Demo finding muted", {
      description: "This action is illustrative. Connect a configured GitHub App to route live actions.",
    });
  };

  if (isLoading || !data) {
    if (error) {
      return <div className="grid min-h-screen place-items-center bg-[#101629] px-5 text-[#d8deec]"><div className="max-w-md rounded-2xl border border-white/12 bg-[#171f38] p-7 text-center"><ShieldAlert className="mx-auto text-[#f1c85b]" size={28} /><p className="mt-5 font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#f1c85b]">Risk map unavailable</p><h1 className="mt-3 text-2xl font-bold tracking-[-.045em] text-white">The demo source did not respond.</h1><p className="mt-3 text-[13px] leading-6 text-[#aeb8cf]">No repository data was changed. Retry the demo source, or return to the product overview.</p><div className="mt-6 flex justify-center gap-3"><button onClick={() => refetch()} className="rounded-lg bg-[#f1c85b] px-4 py-3 text-[12px] font-bold text-[#11172a] hover:bg-[#f7d778]">Retry risk map</button><a href="/" className="rounded-lg border border-white/12 px-4 py-3 text-[12px] font-semibold text-white hover:bg-white/8">Product overview</a></div></div></div>;
    }
    return <div className="grid min-h-screen place-items-center bg-[#101629] text-[#d8deec]"><div className="flex items-center gap-3 font-mono-ui text-xs uppercase tracking-[.15em]"><Loader2 className="animate-spin text-[#f1c85b]" size={18} /> Loading risk map</div></div>;
  }

  return (
    <div className="min-h-screen bg-[#101629] text-[#f7f8fc]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#101629]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1560px] items-center justify-between px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-4"><a href="/" className="grid h-9 w-9 place-items-center rounded-lg border border-white/12 text-[#b8c0d5] hover:bg-white/8" aria-label="Back to landing page"><ArrowLeft size={17} /></a><div className="min-w-0"><div className="flex items-center gap-2"><span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#f1c85b]">Demo workspace</span><span className="hidden h-1 w-1 rounded-full bg-[#697794] sm:block" /><span className="hidden font-mono-ui text-[10px] uppercase tracking-[.12em] text-[#8190ad] sm:inline">read-only simulation</span></div><h1 className="truncate text-[15px] font-bold tracking-[-.025em]">{data.workspace.repository}</h1></div></div>
          <div className="flex items-center gap-3"><span className="hidden rounded-full border border-[#6ddaa7]/25 bg-[#6ddaa7]/10 px-2.5 py-1 font-mono-ui text-[9px] uppercase tracking-[.12em] text-[#8ce8bc] sm:inline">Risk map ready</span><button onClick={() => setMenuOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-lg border border-white/12 px-3 py-2 text-[12px] font-semibold text-white hover:bg-white/8">Workspace <ChevronDown size={14} /></button></div>
        </div>
        {menuOpen && <div className="absolute right-5 top-[60px] z-50 w-[290px] rounded-xl border border-white/12 bg-[#1b2440] p-4 shadow-2xl lg:right-8"><div className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#f1c85b]">Demo boundary</div><p className="mt-2 text-[12px] leading-5 text-[#b8c0d5]">This workspace shows representative scenarios. Live provider diffs, GitHub issues, and repository monitoring activate only after GitHub App setup.</p></div>}
      </header>

      <main className="mx-auto max-w-[1560px] px-5 py-6 lg:px-8 lg:py-8">
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#171f38] p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 w-[45%] bg-[radial-gradient(circle_at_80%_25%,rgba(241,200,91,.23),transparent_46%),radial-gradient(circle_at_62%_80%,rgba(64,185,255,.16),transparent_38%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[1.2fr_.8fr] xl:items-end"><div><div className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#f1c85b]"><Radar size={14} /> Integration risk map</div><h2 className="mt-4 max-w-2xl text-4xl font-bold leading-[.94] tracking-[-.06em] sm:text-5xl">Your upstream dependencies have a change surface.</h2><p className="mt-4 max-w-xl text-[14px] leading-6 text-[#b6c0d6]">This demo shows the finding anatomy Sentinel produces: official source evidence, likely code impact, confidence, owner routing, and a bounded remediation choice.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">{[[data.summary.monitoredProviders, "providers watched"], [data.summary.activeFindings, "active findings"], [`${data.summary.highestRisk}/100`, "highest risk"], [`${data.summary.confidence}%`, "map confidence"]].map(([value, label]) => <div key={String(label)} className="rounded-xl border border-white/10 bg-[#0f1528]/70 p-4"><div className="text-2xl font-bold tracking-[-.06em] text-white">{value}</div><div className="mt-1 font-mono-ui text-[9px] uppercase tracking-[.12em] text-[#8794b0]">{label}</div></div>)}</div></div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0"><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#f1c85b]">Finding queue</p><h2 className="mt-1 text-2xl font-bold tracking-[-.04em]">Review evidence, then act.</h2></div><div className="flex items-center gap-2"><Filter size={14} className="text-[#8e9bb7]" />{(["all", "needs_review", "triaged"] as RiskStatus[]).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 font-mono-ui text-[10px] uppercase tracking-[.11em] transition-colors ${filter === item ? "bg-[#f1c85b] text-[#11172a]" : "border border-white/10 text-[#aeb8cf] hover:bg-white/8"}`}>{item === "all" ? "All" : item.replace("_", " ")}</button>)}</div></div>
            <div className="space-y-3">{visibleFindings.map((finding) => <button type="button" key={finding.id} onClick={() => setSelectedId(finding.id)} className={`group grid w-full gap-5 rounded-xl border p-5 text-left transition-all sm:grid-cols-[12px_1fr_auto] ${selected?.id === finding.id ? "border-[#f1c85b]/70 bg-[#1b2542] shadow-[0_10px_30px_rgba(0,0,0,.16)]" : "border-white/10 bg-[#141b31] hover:border-white/25"}`}><div className="mt-1 h-full min-h-11 w-1 rounded-full" style={{ backgroundColor: finding.providerColor }} /><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-[#aeb8cf]">{finding.provider}</span><span className="rounded border border-white/10 px-1.5 py-0.5 font-mono-ui text-[9px] uppercase tracking-[.1em] text-[#8c99b6]">{finding.type}</span><span className={`rounded border px-1.5 py-0.5 font-mono-ui text-[9px] uppercase tracking-[.1em] ${severityClasses[finding.severity]}`}>{finding.severity}</span></div><h3 className="mt-3 text-[18px] font-bold tracking-[-.03em] text-white">{finding.title}</h3><p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#aeb8cf]">{finding.summary}</p><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 font-mono-ui text-[9px] uppercase tracking-[.1em] text-[#8794b0]"><span>{finding.codePaths.length} code paths</span><span>{Math.round(finding.confidence * 100)}% match confidence</span><span>Owner · {finding.owner}</span></div></div><div className="flex items-start justify-between gap-3 sm:flex-col sm:items-end"><div className="font-mono-ui text-[11px] font-medium text-[#f1c85b]">{finding.riskScore}/100</div><span className="rounded-full border border-white/10 px-2 py-1 font-mono-ui text-[9px] uppercase tracking-[.1em] text-[#aeb8cf]">{statusLabel[finding.status]}</span></div></button>)}</div>
          </div>

          <aside className="xl:sticky xl:top-24 xl:self-start">{selected ? <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#171f38]"><div className="border-b border-white/10 p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#f1c85b]">Selected finding</p><h2 className="mt-2 text-[22px] font-bold leading-[1.02] tracking-[-.045em]">{selected.provider} change review</h2></div><button onClick={() => setSelectedId(null)} className="rounded-lg p-2 text-[#8e9bb7] hover:bg-white/8" aria-label="Close selected finding"><X size={16} /></button></div></div><div className="space-y-6 p-5"><section><div className="flex items-center justify-between"><span className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-[#8592ae]">Official source</span><a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#f1c85b] hover:text-[#f7d778]">Open <ExternalLink size={12} /></a></div><div className="mt-2 rounded-lg border border-white/10 bg-[#101629] p-3 text-[13px] font-medium text-white">{selected.sourceLabel}</div></section><section><div className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-[#8592ae]">Likely code impact</div><div className="mt-2 space-y-2">{selected.codePaths.map((path) => <div key={path} className="flex items-start gap-2 rounded-lg border border-white/10 bg-[#101629] px-3 py-2 font-mono-ui text-[10px] leading-4 text-[#c6d0e4]"><FileCode2 size={13} className="mt-0.5 shrink-0 text-[#6ab8ff]" />{path}</div>)}</div></section><section className="grid grid-cols-2 gap-3"><div className="rounded-lg border border-white/10 bg-[#101629] p-3"><div className="font-mono-ui text-[9px] uppercase tracking-[.1em] text-[#8592ae]">Match</div><div className="mt-1 text-lg font-bold text-white">{Math.round(selected.confidence * 100)}%</div></div><div className="rounded-lg border border-white/10 bg-[#101629] p-3"><div className="font-mono-ui text-[9px] uppercase tracking-[.1em] text-[#8592ae]">Deadline</div><div className="mt-1 text-[12px] font-bold text-white">{selected.due}</div></div></section><section className="rounded-lg border border-[#f1c85b]/20 bg-[#f1c85b]/[.06] p-4"><div className="flex items-center gap-2 font-mono-ui text-[9px] uppercase tracking-[.12em] text-[#f1c85b]"><Sparkles size={13} /> Proposed review sequence</div><p className="mt-2 text-[12px] leading-5 text-[#d2daeb]">Confirm the affected integration owner, review the provider source, validate the code match, and create a bounded test or migration task.</p></section><div className="grid gap-2"><button onClick={() => handleDemoAction("issue")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f1c85b] px-4 py-3 text-[12px] font-bold text-[#11172a] hover:bg-[#f7d778]"><Github size={15} /> Prepare GitHub issue</button><button onClick={() => handleDemoAction("test")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/12 px-4 py-3 text-[12px] font-semibold text-white hover:bg-white/8"><ListChecks size={15} /> Prepare test plan</button><button onClick={() => handleDemoAction("ignore")} className="inline-flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-semibold text-[#9aa7c0] hover:text-white">Mute demo finding</button></div></div></div> : <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center"><ShieldAlert className="mx-auto text-[#f1c85b]" /><h2 className="mt-4 text-xl font-bold">Select a finding</h2><p className="mt-2 text-[13px] leading-6 text-[#aeb8cf]">Inspect the evidence chain and reviewable remediation options.</p></div>}</aside>
        </section>
        <section className="mt-8 rounded-2xl border border-[#6ab8ff]/20 bg-[#6ab8ff]/[.06] p-5 sm:flex sm:items-center sm:justify-between"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-[#7cc5ff]" size={18} /><div><div className="text-[13px] font-bold">This workspace is intentionally honest about its mode.</div><p className="mt-1 max-w-3xl text-[12px] leading-5 text-[#afc1d9]">The map uses representative demo scenarios. A live installation will show your repositories, provider sources, code matches, signed webhooks, and owner-routed actions.</p></div></div><a href="/" className="mt-4 inline-flex items-center gap-2 text-[12px] font-bold text-[#9ccfff] hover:text-[#c6e5ff] sm:mt-0">Back to product overview <ArrowUpRight size={14} /></a></section>
      </main>
    </div>
  );
}
