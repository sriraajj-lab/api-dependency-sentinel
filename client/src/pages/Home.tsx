/**
 * STYLE REMINDER — The Signal Room: a contemporary editorial intelligence desk.
 * Use asymmetric research flow, warm paper surfaces, carbon ink type, Signal Vermilion,
 * and explicit source metadata. Every element should improve scanning or trust.
 */
import {
  ArrowDownRight,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronRight,
  Compass,
  Database,
  ExternalLink,
  Filter,
  Layers3,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type Signal = {
  id: number;
  title: string;
  category: string;
  source: string;
  sourceUrl: string;
  date: string;
  strength: "Strong" | "Watch" | "Emerging";
  excerpt: string;
  investorTake: string;
  tags: string[];
  metric?: string;
};

const heroImage = "/manus-storage/signal-room-hero_ea4d890c.jpg";
const atlasImage = "/manus-storage/signal-atlas_2790f19d.jpg";
const fieldImage = "/manus-storage/field-evidence_e1208d3f.jpg";
const agentImage = "/manus-storage/agent-infrastructure_8a83c000.jpg";
const brandMark = "/manus-storage/venture-signal-mark_3a8867eb.png";

const signals: Signal[] = [
  {
    id: 1,
    title: "The shift from copilots to outcomes",
    category: "Outcome ownership",
    source: "Sequoia",
    sourceUrl: "https://sequoiacap.com/article/services-the-new-software/",
    date: "Mar 2026",
    strength: "Strong",
    excerpt:
      "The durable AI company sells finished work—not another productivity surface. Start where the work is already outsourced and the budget already exists.",
    investorTake:
      "Look for a clean vendor swap, measurable ROI, and a path from a narrow service wedge into a broader labour budget.",
    tags: ["Autopilots", "Services", "ROI"],
    metric: "6×",
  },
  {
    id: 2,
    title: "AI leaves the screen",
    category: "Physical-world systems",
    source: "Y Combinator",
    sourceUrl: "https://www.ycombinator.com/rfs",
    date: "Fall 2026",
    strength: "Strong",
    excerpt:
      "The next operating systems coordinate agents, robots, wearables, and the people doing real work in construction, maintenance, fleets, and infrastructure.",
    investorTake:
      "Prioritize repeatable operational workflows where work is expensive, badly observed, and rich in proprietary process data.",
    tags: ["Field work", "Robotics", "Operations"],
    metric: "80%",
  },
  {
    id: 3,
    title: "Data entropy is the hidden bottleneck",
    category: "Data & provenance",
    source: "a16z",
    sourceUrl: "https://a16z.com/newsletter/big-ideas-2026-part-1/",
    date: "Dec 2025",
    strength: "Strong",
    excerpt:
      "Models improve while the source material stays fragmented across PDFs, images, logs, videos, and emails. The context layer is becoming the product.",
    investorTake:
      "Back systems that create fresh, governed, source-linked context—not thin chat interfaces over stale data.",
    tags: ["Multimodal", "Context", "Trust"],
  },
  {
    id: 4,
    title: "Agents need a control plane",
    category: "Agent infrastructure",
    source: "Hacker News",
    sourceUrl: "https://news.ycombinator.com/item?id=47350516",
    date: "Mar 2026",
    strength: "Watch",
    excerpt:
      "Composable agent runtimes are proliferating, but builders still wrestle with cost control, sandboxing, policy, state, and reliable execution.",
    investorTake:
      "The durable layer is coordination: permissions, observable state, budget guardrails, and safe interfaces to consequential tools.",
    tags: ["Agents", "Safety", "Infrastructure"],
  },
  {
    id: 5,
    title: "Physical observability becomes a platform",
    category: "Physical-world systems",
    source: "a16z",
    sourceUrl: "https://a16z.com/newsletter/big-ideas-2026-part-2/",
    date: "Dec 2025",
    strength: "Emerging",
    excerpt:
      "Maintenance jobs, meter reads, truck rolls, and production runs create valuable data, but few workflows capture it with provenance or reuse it downstream.",
    investorTake:
      "A trusted coordination layer for collection, annotation, consent, and asset history can become infrastructure for automation.",
    tags: ["Industrial data", "Sensors", "Assets"],
  },
  {
    id: 6,
    title: "Trust is a feature, not a policy page",
    category: "Trust & compliance",
    source: "Y Combinator",
    sourceUrl: "https://www.ycombinator.com/rfs",
    date: "Fall 2026",
    strength: "Watch",
    excerpt:
      "As software and agents touch more of the world, identity, proof, compliance, and human accountability become core product surfaces.",
    investorTake:
      "Source media, access control, signoff, audit trails, and permissioning can form the real moat around AI action.",
    tags: ["Compliance", "Identity", "Audit"],
  },
  {
    id: 7,
    title: "Portable evidence is an underbuilt transaction layer",
    category: "Application wedge",
    source: "Venture Signal synthesis",
    sourceUrl: "https://www.ycombinator.com/rfs",
    date: "Research thesis",
    strength: "Emerging",
    excerpt:
      "Field work is documented inside contractor tools, but asset owners, future technicians, insurers, and warranty teams need a record that survives vendor changes.",
    investorTake:
      "ProofPass: turn each repair into a source-linked, cross-company asset record that can unlock approval, payment, warranty, or the next action.",
    tags: ["ProofPass", "HVAC", "Evidence"],
  },
];

const topics = [
  "All signals",
  "Outcome ownership",
  "Physical-world systems",
  "Data & provenance",
  "Agent infrastructure",
  "Trust & compliance",
  "Application wedge",
];

const sources = ["All sources", "Y Combinator", "a16z", "Sequoia", "Hacker News", "Venture Signal synthesis"];

const sourceLedger = [
  { label: "YC Requests", note: "Explicit founder prompts", count: "09", url: "https://www.ycombinator.com/rfs" },
  { label: "a16z Big Ideas", note: "Infrastructure + app theses", count: "02", url: "https://a16z.com/newsletter/big-ideas-2026-part-1/" },
  { label: "Sequoia", note: "Outcome ownership", count: "01", url: "https://sequoiacap.com/article/services-the-new-software/" },
  { label: "Launch surfaces", note: "Product Hunt + HN", count: "02", url: "https://www.producthunt.com/topics/artificial-intelligence" },
];

function strengthClasses(strength: Signal["strength"]) {
  if (strength === "Strong") return "border-[#e84b2f]/25 bg-[#e84b2f]/10 text-[#b73622]";
  if (strength === "Watch") return "border-[#56666c]/25 bg-[#56666c]/10 text-[#435156]";
  return "border-[#c89d4e]/30 bg-[#f3e7ca] text-[#946f2e]";
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState("All signals");
  const [activeSource, setActiveSource] = useState("All sources");
  const [selectedId, setSelectedId] = useState(1);
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredSignals = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return signals.filter((signal) => {
      const searchable = [
        signal.title,
        signal.category,
        signal.source,
        signal.excerpt,
        signal.investorTake,
        ...signal.tags,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesTopic = activeTopic === "All signals" || signal.category === activeTopic;
      const matchesSource = activeSource === "All sources" || signal.source === activeSource;
      return matchesQuery && matchesTopic && matchesSource;
    });
  }, [activeSource, activeTopic, query]);

  const selectedSignal = signals.find((signal) => signal.id === selectedId) ?? signals[0];

  const scrollToSignals = () => {
    document.getElementById("signals")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f2eb] text-[#1c2520]">
      <header className="sticky top-0 z-50 border-b border-[#1c2520]/10 bg-[#f6f2eb]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-[1480px] items-center justify-between px-5 lg:px-8">
          <a href="#top" className="group flex items-center gap-3" aria-label="Venture Signal Hub home">
            <img src={brandMark} alt="" className="h-9 w-9 transition-transform duration-200 group-hover:rotate-6" />
            <span className="font-display text-[21px] leading-none tracking-[-0.04em]">Venture Signal</span>
            <span className="hidden border-l border-[#1c2520]/20 pl-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64716a] sm:inline">Research hub</span>
          </a>

          <nav className="hidden items-center gap-7 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e6a63] md:flex">
            <a href="#signals" className="transition-colors hover:text-[#e84b2f]">Signals</a>
            <a href="#thesis" className="transition-colors hover:text-[#e84b2f]">Thesis</a>
            <a href="#sources" className="transition-colors hover:text-[#e84b2f]">Sources</a>
          </nav>

          <button
            type="button"
            onClick={scrollToSignals}
            className="hidden items-center gap-2 bg-[#1c2520] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#f6f2eb] transition-transform duration-150 hover:bg-[#e84b2f] active:scale-[0.97] sm:flex"
          >
            Explore the field <ArrowDownRight size={14} />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="grid h-10 w-10 place-items-center border border-[#1c2520]/15 text-[#1c2520] md:hidden"
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-[#1c2520]/10 bg-[#f6f2eb] px-5 py-4 md:hidden">
            <div className="flex flex-col gap-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e6a63]">
              <a href="#signals" onClick={() => setMenuOpen(false)}>Signals</a>
              <a href="#thesis" onClick={() => setMenuOpen(false)}>Thesis</a>
              <a href="#sources" onClick={() => setMenuOpen(false)}>Sources</a>
            </div>
          </div>
        )}
      </header>

      <main id="top">
        <section className="relative isolate overflow-hidden bg-[#1c2520] text-[#f6f2eb]">
          <img src={heroImage} alt="A research desk with layered investment notes and a horizon scan line" className="absolute inset-0 h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,25,21,.96)_0%,rgba(17,25,21,.84)_45%,rgba(17,25,21,.35)_100%)]" />
          <div className="absolute left-0 right-0 top-[56%] h-px bg-[#e84b2f]" />
          <div className="relative mx-auto grid min-h-[620px] max-w-[1480px] items-end gap-10 px-5 pb-10 pt-20 lg:grid-cols-[1.15fr_.85fr] lg:px-8 lg:pb-12 lg:pt-28">
            <div className="max-w-3xl">
              <div className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d2cdc4]">
                <span className="h-2 w-2 rounded-full bg-[#e84b2f]" />
                Research cut · 17 Aug 2026
              </div>
              <h1 className="font-display max-w-3xl text-[clamp(3.6rem,7vw,7.1rem)] leading-[0.88] tracking-[-0.065em]">
                Trace the work<br />becoming <span className="text-[#e84b2f] italic">software.</span>
              </h1>
              <p className="mt-8 max-w-xl text-[17px] leading-7 text-[#dfdad1] lg:text-[19px]">
                A searchable map of startup signals across YC, a16z, Sequoia, Product Hunt, Hacker News, and the investor ecosystem.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button type="button" onClick={scrollToSignals} className="inline-flex items-center gap-2 bg-[#e84b2f] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.13em] text-white transition-transform duration-150 hover:bg-[#f05b3d] active:scale-[0.97]">
                  Browse live signals <ArrowDownRight size={15} />
                </button>
                <a href="#thesis" className="inline-flex items-center gap-2 border border-white/25 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.13em] text-[#f6f2eb] transition-colors hover:border-white/70">
                  Read the thesis <ChevronRight size={15} />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-3 border-t border-white/20 lg:border-l lg:border-t-0 lg:pl-10">
              {[
                ["07", "ecosystem", "sources"],
                ["07", "investable", "signals"],
                ["01", "recommended", "wedge"],
              ].map(([number, lineOne, lineTwo], index) => (
                <div key={number + lineOne} className={`px-3 py-5 sm:px-5 ${index !== 0 ? "border-l border-white/20" : ""}`}>
                  <div className="font-display text-4xl tracking-[-0.06em] text-[#f6f2eb]">{number}</div>
                  <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c9c4bc]">{lineOne}<br />{lineTwo}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1480px] px-5 lg:px-8">
          <section className="grid gap-8 py-14 lg:grid-cols-[210px_minmax(0,1fr)] lg:py-20">
            <div className="lg:pt-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e84b2f]">Signal map / 01</p>
              <h2 className="font-display mt-4 text-4xl leading-none tracking-[-0.05em]">The pattern<br />behind the noise.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: Target, label: "Outcome", copy: "The best AI companies sell an achieved result—not a productivity feature.", index: "01" },
                { icon: Database, label: "Context", copy: "The data layer becomes valuable when it stays fresh, structured, source-linked, and usable.", index: "02" },
                { icon: ShieldCheck, label: "Trust", copy: "As work becomes automated, provenance, permissions, and audit trails become product surfaces.", index: "03" },
              ].map(({ icon: Icon, label, copy, index }) => (
                <article key={label} className="relative min-h-[220px] border border-[#1c2520]/12 bg-[#f8f5ef] p-6 transition-transform duration-200 hover:-translate-y-1 hover:border-[#1c2520]/30">
                  <div className="absolute left-6 right-6 top-0 h-px bg-[#e84b2f]" />
                  <div className="flex items-start justify-between"><Icon size={22} strokeWidth={1.6} className="text-[#1c2520]" /><span className="font-display text-3xl tracking-[-0.06em] text-[#e84b2f]">{index}</span></div>
                  <div className="mt-7 text-[9px] font-bold uppercase tracking-[0.16em] text-[#67726b]">Cross-source pattern</div>
                  <h3 className="font-display mt-2 text-3xl tracking-[-0.04em]">{label} ownership</h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-[#38433d]">{copy}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section id="signals" className="border-y border-[#1c2520]/10 bg-[#ebe5db] py-14 lg:py-20">
          <div className="mx-auto max-w-[1480px] px-5 lg:px-8">
            <div className="grid gap-8 xl:grid-cols-[290px_minmax(0,1fr)]">
              <aside className="xl:sticky xl:top-24 xl:self-start">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e84b2f]">Signal index / 02</p>
                <h2 className="font-display mt-4 text-5xl leading-[0.92] tracking-[-0.06em]">Search the<br />field.</h2>
                <p className="mt-5 max-w-[260px] text-sm leading-6 text-[#59655e]">Filter the research by investor lens, category, or the actual language used in the source material.</p>

                <div className="mt-9 hidden border-t border-[#1c2520]/10 pt-5 xl:block">
                  <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#59655e]"><Filter size={13} /> Research lenses</div>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setActiveTopic(topic)}
                        className={`border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${activeTopic === topic ? "border-[#1c2520] bg-[#1c2520] text-[#f6f2eb]" : "border-[#1c2520]/15 bg-[#f6f2eb]/50 text-[#59655e] hover:border-[#1c2520]/45"}`}
                      >
                        {topic.replace(" systems", "")}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              <div>
                <div className="border-b border-[#1c2520]/15 pb-6">
                  <label className="relative block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6a756e]" size={19} />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search signals, terms, or opportunity spaces"
                      className="h-14 w-full border border-[#1c2520]/15 bg-[#f6f2eb] pl-12 pr-12 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-[#7c867f] focus:border-[#e84b2f] focus:ring-4 focus:ring-[#e84b2f]/10"
                    />
                    {query && (
                      <button type="button" onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6a756e] hover:text-[#e84b2f]" aria-label="Clear search"><X size={18} /></button>
                    )}
                  </label>
                  <div className="mt-4 flex flex-wrap items-center gap-2 xl:hidden">
                    {topics.map((topic) => (
                      <button key={topic} type="button" onClick={() => setActiveTopic(topic)} className={`border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] ${activeTopic === topic ? "border-[#1c2520] bg-[#1c2520] text-[#f6f2eb]" : "border-[#1c2520]/15 bg-[#f6f2eb] text-[#59655e]"}`}>{topic.replace(" systems", "")}</button>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#667169]">{filteredSignals.length} signal{filteredSignals.length === 1 ? "" : "s"} surfaced</span>
                    <div className="flex flex-wrap gap-2">
                      {sources.map((source) => (
                        <button
                          type="button"
                          key={source}
                          onClick={() => setActiveSource(source)}
                          className={`rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.05em] transition-colors ${activeSource === source ? "bg-[#e84b2f] text-white" : "bg-[#dcd5ca] text-[#58635c] hover:bg-[#cfc7bb]"}`}
                        >
                          {source}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {filteredSignals.map((signal) => (
                    <button
                      type="button"
                      key={signal.id}
                      onClick={() => setSelectedId(signal.id)}
                      className={`group relative min-h-[286px] overflow-hidden border p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(28,37,32,.08)] ${selectedSignal.id === signal.id ? "border-[#e84b2f] bg-[#f8f4ed]" : "border-[#1c2520]/12 bg-[#f6f2eb] hover:border-[#1c2520]/40"}`}
                    >
                      <div className="absolute left-0 top-0 h-full w-1 bg-[#e84b2f] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                      <div className="flex items-start justify-between gap-4">
                        <div><span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#657168]">Dossier / {String(signal.id).padStart(2, "0")}</span><div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1c2520]">{signal.category}</div></div>
                        <div className="text-right"><span className={`border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${strengthClasses(signal.strength)}`}>{signal.strength}</span><div className="mt-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6b756f]">{signal.source}</div></div>
                      </div>
                      <h3 className="font-display mt-7 max-w-sm text-[32px] leading-[0.98] tracking-[-0.045em] text-[#1c2520]">{signal.title}</h3>
                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#556058]">{signal.excerpt}</p>
                      <div className="mt-5 flex items-end justify-between border-t border-[#1c2520]/10 pt-4">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#566159]">Source trail · {signal.source} · {signal.date}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#e84b2f] opacity-0 transition-opacity group-hover:opacity-100">Open <ArrowUpRight size={13} /></span>
                      </div>
                    </button>
                  ))}
                </div>

                {filteredSignals.length === 0 && (
                  <div className="mt-6 border border-dashed border-[#1c2520]/25 bg-[#f6f2eb] px-7 py-14 text-center">
                    <Compass className="mx-auto text-[#e84b2f]" size={28} />
                    <h3 className="font-display mt-4 text-3xl tracking-[-0.04em]">No signal in this cut.</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#59655e]">Try a wider source or remove a research lens to surface adjacent evidence.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-5 py-14 lg:px-8 lg:py-20">
          <div className="grid gap-10 xl:grid-cols-[1.05fr_.95fr]">
            <article className="border border-[#1c2520]/12 bg-[#fbf8f2] p-7 sm:p-9">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#e84b2f]"><Sparkles size={14} /> Selected dossier</div>
                <span className={`border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${strengthClasses(selectedSignal.strength)}`}>{selectedSignal.strength}</span>
              </div>
              <div className="mt-10 flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-xl">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#657168]">{selectedSignal.category}</p>
                  <h2 className="font-display mt-3 text-5xl leading-[0.94] tracking-[-0.06em] sm:text-6xl">{selectedSignal.title}</h2>
                </div>
                {selectedSignal.metric && (
                  <div className="border-l border-[#1c2520]/15 pl-5">
                    <div className="font-display text-5xl leading-none tracking-[-0.06em] text-[#e84b2f]">{selectedSignal.metric}</div>
                    <div className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#67726b]">signal metric</div>
                  </div>
                )}
              </div>
              <p className="mt-8 max-w-2xl text-[17px] leading-8 text-[#354038]">{selectedSignal.excerpt}</p>
              <div className="mt-8 border-l-2 border-[#e84b2f] bg-[#f3ede4] p-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#e84b2f]">Investor read-through</div>
                <p className="mt-2 text-sm leading-6 text-[#455047]">{selectedSignal.investorTake}</p>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {selectedSignal.tags.map((tag) => <span key={tag} className="border border-[#1c2520]/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#536058]">{tag}</span>)}
                </div>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setSaved((current) => !current)} className={`inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] ${saved ? "text-[#e84b2f]" : "text-[#556058] hover:text-[#e84b2f]"}`}>
                    {saved ? <Check size={14} /> : <Bookmark size={14} />} {saved ? "Saved" : "Save thesis"}
                  </button>
                  <a href={selectedSignal.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[#1c2520] hover:text-[#e84b2f]">Source <ExternalLink size={14} /></a>
                </div>
              </div>
            </article>

            <div className="relative min-h-[440px] overflow-hidden bg-[#1c2520] p-7 sm:p-9">
              <img src={atlasImage} alt="An abstract startup opportunity atlas with signal markers" className="absolute inset-0 h-full w-full object-cover opacity-55" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,29,25,.95),rgba(20,29,25,.5))]" />
              <div className="relative flex h-full flex-col justify-between text-[#f6f2eb]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f09b88]">Opportunity atlas</p>
                  <h2 className="font-display mt-4 max-w-md text-5xl leading-[0.93] tracking-[-0.06em]">Invest where the evidence compounds.</h2>
                </div>
                <div className="mt-12 grid grid-cols-3 gap-3 border-t border-white/20 pt-6">
                  <div><div className="font-display text-4xl tracking-[-0.05em]">01</div><p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#cfcac1]">Narrow<br />workflow</p></div>
                  <div><div className="font-display text-4xl tracking-[-0.05em]">02</div><p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#cfcac1]">Measured<br />outcome</p></div>
                  <div><div className="font-display text-4xl tracking-[-0.05em]">03</div><p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#cfcac1]">Compounding<br />data</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="thesis" className="relative overflow-hidden bg-[#dfe7e1]">
          <div className="absolute left-0 top-0 h-px w-full bg-[#e84b2f]" />
          <div className="mx-auto grid max-w-[1480px] gap-8 px-5 py-14 lg:grid-cols-[.85fr_1.15fr] lg:px-8 lg:py-20">
            <div className="overflow-hidden bg-[#1c2520]">
              <img src={fieldImage} alt="A conceptual record of physical-world maintenance evidence" className="h-full min-h-[380px] w-full object-cover" />
            </div>
            <div className="py-2 lg:pl-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e84b2f]">Recommended wedge / 03</p>
              <h2 className="font-display mt-4 max-w-3xl text-[clamp(3.2rem,6vw,5.8rem)] leading-[0.9] tracking-[-0.065em]">A trusted data layer for work that happens <span className="italic">off-screen.</span></h2>
              <p className="mt-7 max-w-2xl text-[17px] leading-8 text-[#3f4c44]">ProofPass is a portable maintenance passport for physical assets. A technician scans an asset, records source evidence, and creates a durable job history that travels across contractors, owners, warranty teams, and insurers.</p>
              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                {[
                  ["Portable", "The record follows the asset, not a vendor account."],
                  ["Cross-company", "Owners, contractors, and reviewers act from the same proof."],
                  ["Evidence-backed", "Source media, timestamps, readings, and signoff stay linked."],
                  ["Transaction-triggering", "The record can unlock approval, payment, warranty, or a next step."],
                ].map(([title, copy]) => (
                  <div key={title} className="border-t border-[#1c2520]/15 py-5 pr-4"><h3 className="font-display text-2xl tracking-[-0.035em]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#526057]">{copy}</p></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-[1480px] px-5 py-14 lg:px-8 lg:py-20">
          <div className="mb-5 flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.17em] text-[#67726b]"><span className="h-px w-9 bg-[#e84b2f]" /> Field note / validation cut</div>
          <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
            <div className="border border-[#1c2520]/12 bg-[#f8f5ee] p-7 sm:p-9">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e84b2f]">Validation operating system</p>
              <h2 className="font-display mt-4 text-5xl leading-[0.92] tracking-[-0.06em]">Do not build<br />before the evidence.</h2>
              <div className="mt-10 space-y-4">
                {[
                  ["01", "Interview the workflow", "Speak with 10 contractors and 10 property managers. Collect real close-out packets, invoices, and approval delays."],
                  ["02", "Run a concierge proof", "Use a mobile form, QR labels, and human review to generate 10 source-linked records before writing a large product."],
                  ["03", "Measure the transaction", "Compare approval time, missing-evidence follow-ups, and dispute risk with and without a trusted record."],
                ].map(([number, title, copy]) => (
                  <div key={number} className="grid grid-cols-[52px_1fr] gap-4 border-t border-[#1c2520]/10 pt-4"><span className="font-display text-3xl tracking-[-0.06em] text-[#e84b2f]">{number}</span><div><h3 className="font-display text-2xl tracking-[-0.03em]">{title}</h3><p className="mt-1 text-sm leading-6 text-[#556159]">{copy}</p></div></div>
                ))}
              </div>
            </div>
            <div className="relative min-h-[500px] overflow-hidden bg-[#1c2520]">
              <img src={agentImage} alt="Abstract infrastructure representing trustworthy agent coordination" className="absolute inset-0 h-full w-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(20,29,25,.88),rgba(20,29,25,.18))]" />
              <div className="relative flex h-full flex-col justify-end p-7 text-[#f6f2eb] sm:p-9">
                <Layers3 size={25} className="mb-auto text-[#f09b88]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f09b88]">The infrastructural insight</p>
                <blockquote className="font-display mt-4 max-w-lg text-4xl leading-[0.98] tracking-[-0.05em]">“The most defensible application does not merely understand work. It preserves what actually happened.”</blockquote>
              </div>
            </div>
          </div>
        </section>

        <section id="sources" className="relative border-t border-[#1c2520]/10 bg-[#1c2520] text-[#f6f2eb]">
          <div className="absolute left-0 top-0 h-px w-full bg-[#e84b2f]" />
          <div className="mx-auto max-w-[1480px] px-5 py-14 lg:px-8 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f09b88]">Source ledger / 04</p>
                <h2 className="font-display mt-4 text-5xl leading-[0.92] tracking-[-0.06em]">Evidence with<br />a trail.</h2>
                <p className="mt-6 max-w-sm text-sm leading-6 text-[#c9c4bc]">Each signal begins with a public source and is intentionally framed as directional research—not a proxy for durable market demand.</p>
              </div>
              <div className="border-t border-white/20">
                {sourceLedger.map((source) => (
                  <a key={source.label} href={source.url} target="_blank" rel="noreferrer" className="group grid grid-cols-[54px_1fr_auto] items-center gap-4 border-b border-white/15 py-5 transition-colors hover:text-[#f09b88]">
                    <span className="font-display text-3xl tracking-[-0.05em] text-[#f09b88]">{source.count}</span>
                    <div><h3 className="font-display text-2xl tracking-[-0.035em]">{source.label}</h3><p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-[#b7b2aa]">{source.note}</p></div>
                    <ArrowUpRight size={18} className="transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#1c2520] px-5 pb-8 text-[#b7b2aa] lg:px-8">
        <div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-4 border-t border-white/15 pt-6 text-[10px] font-semibold uppercase tracking-[0.12em] sm:flex-row">
          <span>Venture Signal Hub · Research cut: Aug 2026</span>
          <span>Built from source-backed ecosystem analysis</span>
        </div>
      </footer>
    </div>
  );
}
