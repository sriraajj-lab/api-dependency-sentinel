import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleAlert,
  Code2,
  FileSearch,
  Github,
  GitPullRequest,
  Radar,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";

const heroImage = "/manus-storage/api-sentinel-hero_1b0c4c7f.jpg";
const mark = "/manus-storage/api-sentinel-mark_72bfe6eb.png";

const steps = [
  ["01", "Map", "Connect a repository. Sentinel identifies supported API clients, webhook handlers, and likely integration owners."],
  ["02", "Watch", "We diff official provider sources, including release notes, published schemas, and deprecation notices."],
  ["03", "Prove", "Every alert links the source change to likely code paths, confidence, deadline, and a reviewable next step."],
];

const evidence = [
  { icon: FileSearch, label: "Official source", copy: "Provider release notes, OpenAPI descriptions, and documented deprecations." },
  { icon: Code2, label: "Code-aware match", copy: "Repository references are surfaced with a confidence score—not presented as certainty." },
  { icon: GitPullRequest, label: "Human-reviewed action", copy: "Create an issue, test plan, or draft PR only after an accountable owner decides." },
];

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#101629] text-[#f7f8fc] selection:bg-[#f1c85b] selection:text-[#101629]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#101629]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="/" className="flex items-center gap-3" aria-label="API Dependency Sentinel home">
            <img className="h-9 w-9 rounded-[10px]" src={mark} alt="" />
            <span className="text-[15px] font-bold tracking-[-0.025em]">API Dependency Sentinel</span>
            <span className="hidden border-l border-white/20 pl-3 font-mono-ui text-[10px] uppercase tracking-[0.16em] text-[#8e98b3] sm:inline">integration intelligence</span>
          </a>
          <nav className="hidden items-center gap-6 text-[12px] font-medium text-[#b8c0d5] md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-[#f1c85b]">How it works</a>
            <a href="#evidence" className="transition-colors hover:text-[#f1c85b]">Evidence model</a>
            <a href="#pricing" className="transition-colors hover:text-[#f1c85b]">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href="/workspace" className="hidden rounded-lg px-3 py-2 text-[12px] font-semibold text-[#dfe4f2] transition-colors hover:bg-white/8 sm:inline-flex">Open demo</a>
            <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#f1c85b] px-3.5 py-2.5 text-[12px] font-bold text-[#11172a] shadow-[0_8px_24px_rgba(241,200,91,.18)] transition-transform hover:bg-[#f7d778] active:scale-[.97]">
              Connect GitHub <Github size={15} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b border-white/10">
          <img src={heroImage} alt="Abstract dependency signals moving through a deep blue infrastructure field" className="absolute inset-0 -z-20 h-full w-full object-cover object-right opacity-70" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#101629_0%,rgba(16,22,41,.96)_35%,rgba(16,22,41,.72)_62%,rgba(16,22,41,.36)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-[35%] bg-[linear-gradient(transparent,#101629)]" />
          <div className="mx-auto grid min-h-[690px] max-w-7xl items-end px-5 pb-14 pt-20 lg:px-8 lg:pb-16 lg:pt-28">
            <div className="max-w-4xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#f1c85b]/30 bg-[#f1c85b]/10 px-3 py-1.5 font-mono-ui text-[10px] font-medium uppercase tracking-[0.14em] text-[#f5d57a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f1c85b] shadow-[0_0_12px_#f1c85b]" />
                upstream change intelligence
              </div>
              <h1 className="max-w-4xl text-[clamp(3.6rem,8vw,7.5rem)] font-bold leading-[.86] tracking-[-0.075em] text-white">
                Know the API change<br />before it <span className="text-[#f1c85b]">breaks you.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-[17px] leading-8 text-[#d3daec] sm:text-[19px]">
                Sentinel watches the external APIs your product consumes, maps meaningful provider changes to likely code impact, and prepares a source-backed next step for owner review.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a href="/workspace" className="inline-flex items-center gap-2 rounded-lg bg-[#f1c85b] px-5 py-3.5 text-[12px] font-bold text-[#11172a] transition-transform hover:bg-[#f7d778] active:scale-[.97]">Explore the risk map <ArrowRight size={16} /></a>
                <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/[.06] px-5 py-3.5 text-[12px] font-semibold text-white transition-colors hover:border-white/45 hover:bg-white/[.12]">See connection setup <ChevronRight size={16} /></button>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 font-mono-ui text-[10px] uppercase tracking-[0.12em] text-[#9da8c1]">
                <span className="flex items-center gap-2"><Check size={13} className="text-[#64d6a1]" /> Read-only repository access</span>
                <span className="flex items-center gap-2"><Check size={13} className="text-[#64d6a1]" /> Source-linked findings</span>
                <span className="flex items-center gap-2"><Check size={13} className="text-[#64d6a1]" /> Human approval before action</span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#141b31]">
          <div className="mx-auto grid max-w-7xl gap-0 px-5 lg:grid-cols-4 lg:px-8">
            {[
              ["01", "Map API surface", "SDK imports, endpoint paths, and webhook handlers become a dependency map."],
              ["02", "Read official deltas", "We track explicit provider sources—not social chatter or unverified summaries."],
              ["03", "Locate likely impact", "Every finding names the affected path, confidence, and business urgency."],
              ["04", "Approve remediation", "Issues, test plans, and later draft PRs stay in the owner’s control."],
            ].map(([index, title, copy], itemIndex) => (
              <article key={title} className={`relative py-8 lg:px-6 ${itemIndex ? "border-t border-white/10 lg:border-l lg:border-t-0" : ""}`}>
                <span className="font-mono-ui text-[10px] text-[#f1c85b]">{index}</span>
                <h2 className="mt-5 text-[20px] font-bold tracking-[-0.035em]">{title}</h2>
                <p className="mt-2 max-w-xs text-[13px] leading-6 text-[#aeb8cf]">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[.68fr_1.32fr] lg:gap-20">
            <div>
              <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.16em] text-[#f1c85b]">The core loop / 01</p>
              <h2 className="mt-4 max-w-md text-5xl font-bold leading-[.93] tracking-[-.065em] sm:text-6xl">A dependency alert you can trust.</h2>
              <p className="mt-6 max-w-sm text-[15px] leading-7 text-[#aeb8cf]">Version one is intentionally narrow: GitHub repository context, a small supported-provider set, official source diffs, and an owner-reviewed action surface.</p>
            </div>
            <div className="grid gap-3">
              {steps.map(([number, title, copy]) => (
                <article key={number} className="group grid gap-5 rounded-2xl border border-white/10 bg-[#171f38] p-6 transition-colors hover:border-[#f1c85b]/50 sm:grid-cols-[80px_1fr_auto] sm:items-center sm:p-7">
                  <span className="font-mono-ui text-2xl font-medium text-[#f1c85b]">{number}</span>
                  <div><h3 className="text-2xl font-bold tracking-[-.04em]">{title}</h3><p className="mt-2 max-w-xl text-[14px] leading-6 text-[#aeb8cf]">{copy}</p></div>
                  <ArrowRight className="hidden text-[#7582a3] transition-transform group-hover:translate-x-1 group-hover:text-[#f1c85b] sm:block" />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="evidence" className="border-y border-white/10 bg-[#0c1121]">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-28">
            <div>
              <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.16em] text-[#f1c85b]">Evidence before automation / 02</p>
              <h2 className="mt-4 text-5xl font-bold leading-[.92] tracking-[-.065em] sm:text-6xl">Do not replace an incident with an unreviewed fix.</h2>
              <p className="mt-7 max-w-2xl text-[17px] leading-8 text-[#bec7da]">Sentinel is built for decisions, not noise. Each finding shows the upstream source, a bounded code match, a confidence estimate, and the exact action it is allowed to prepare.</p>
              <div className="mt-9 rounded-xl border border-[#f1c85b]/20 bg-[#f1c85b]/[.06] p-5">
                <div className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#f3d57d]"><CircleAlert size={14} /> Product boundary</div>
                <p className="mt-3 text-[14px] leading-6 text-[#d8deec]">Sentinel can draft an issue, test plan, or migration pull request. It does not autonomously modify production code, send provider requests, or bypass an engineering owner.</p>
              </div>
            </div>
            <div className="grid content-start gap-3">
              {evidence.map(({ icon: Icon, label, copy }) => (
                <article key={label} className="rounded-2xl border border-white/10 bg-[#141b31] p-6"><Icon size={22} className="text-[#f1c85b]" /><h3 className="mt-6 text-[19px] font-bold tracking-[-.03em]">{label}</h3><p className="mt-2 text-[14px] leading-6 text-[#aeb8cf]">{copy}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[.16em] text-[#f1c85b]">Pricing hypothesis / 03</p><h2 className="mt-4 text-5xl font-bold leading-[.92] tracking-[-.065em] sm:text-6xl">Price a prevented break,<br />not a generic alert.</h2></div>
            <p className="max-w-md text-[14px] leading-6 text-[#aeb8cf]">These early plans are designed for validation. Design partners receive hands-on source coverage and feedback channels in return for proof of real use.</p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {[
              ["Risk Map", "$0", "One repository", "See supported dependency exposure before you buy.", "Open demo"],
              ["Builder", "$39", "per month", "One production repository · five monitored APIs · finding queue.", "Join design partner"],
              ["Team", "$149", "per month", "Ten repositories · owner routing · shared remediation history.", "Talk to us"],
            ].map(([name, price, descriptor, copy, cta], index) => (
              <article key={name} className={`rounded-2xl border p-7 ${index === 1 ? "border-[#f1c85b] bg-[#1c2542] shadow-[0_18px_45px_rgba(0,0,0,.2)]" : "border-white/10 bg-[#141b31]"}`}>
                <div className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-[#f1c85b]">{index === 1 ? "Early access" : "Sentinel"}</div>
                <h3 className="mt-4 text-2xl font-bold tracking-[-.04em]">{name}</h3>
                <div className="mt-8 flex items-end gap-2"><span className="text-5xl font-bold tracking-[-.07em]">{price}</span><span className="pb-1 font-mono-ui text-[10px] uppercase tracking-[.12em] text-[#95a0ba]">{descriptor}</span></div>
                <p className="mt-6 min-h-[48px] text-[14px] leading-6 text-[#aeb8cf]">{copy}</p>
                <a href={index === 0 ? "/workspace" : "mailto:founders@dependency-sentinel.dev?subject=API%20Dependency%20Sentinel%20design%20partner"} className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[12px] font-bold transition-transform active:scale-[.97] ${index === 1 ? "bg-[#f1c85b] text-[#101629] hover:bg-[#f7d778]" : "border border-white/15 text-[#f6f8fe] hover:bg-white/8"}`}>{cta}<ArrowRight size={15} /></a>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#0c1121]">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 py-8 lg:flex-row lg:px-8"><div className="flex items-center gap-3"><img src={mark} className="h-7 w-7 rounded-md" alt="" /><span className="text-[13px] font-bold">API Dependency Sentinel</span></div><p className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-[#7e89a4]">Source-linked upstream change intelligence · GitHub-first</p></div>
      </footer>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#070a14]/80 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="connect-title">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#171f38] p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-5"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#f1c85b] text-[#101629]"><Github size={21} /></div><button onClick={() => setModalOpen(false)} className="rounded-lg p-2 text-[#aeb8cf] hover:bg-white/8 hover:text-white" aria-label="Close connection setup"><X size={18} /></button></div>
            <p className="mt-7 font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#f1c85b]">Connection setup</p>
            <h2 id="connect-title" className="mt-3 text-3xl font-bold tracking-[-.05em]">GitHub App installation is ready for configuration.</h2>
            <p className="mt-4 text-[14px] leading-6 text-[#b8c0d5]">The product already supports a secure server-side connection model, but live installation is intentionally gated until the project’s GitHub App ID, private key, and webhook secret are registered. In the meantime, explore the fully labelled demo risk map.</p>
            <div className="mt-6 rounded-xl border border-white/10 bg-black/15 p-4 font-mono-ui text-[11px] leading-6 text-[#aeb8cf]">Required before live monitoring:<br />• GitHub App ID + client credentials<br />• App private key<br />• Webhook secret + production callback URL</div>
            <div className="mt-6 flex flex-wrap gap-3"><a href="/workspace" className="inline-flex items-center gap-2 rounded-lg bg-[#f1c85b] px-4 py-3 text-[12px] font-bold text-[#101629]">Open demo risk map <ArrowRight size={15} /></a><button onClick={() => setModalOpen(false)} className="rounded-lg border border-white/15 px-4 py-3 text-[12px] font-semibold text-white hover:bg-white/8">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
