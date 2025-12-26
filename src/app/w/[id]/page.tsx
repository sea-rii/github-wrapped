// src/app/w/[id]/page.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { toPng } from "html-to-image";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { SlideShell } from "@/components/wrapped/SlideShell";
import { ProgressDots } from "@/components/wrapped/ProgressDots";

type WrappedOk = {
  id: string;
  year: number;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;

  profile?: {
    name?: string;
    login: string;
    avatarUrl?: string;
  };

  totals?: {
    contributions?: number;
    commits?: number;
    prs?: number;
    issues?: number;

    // these may or may not exist in your payload yet
    activeDays?: number;
    repoCount?: number;
  };

  fun?: {
    badge?: string;
    bestMonth?: string;
    bestWeekday?: string; // e.g. "Sun"
  };

  vibe?: {
    label?: string; // older shape
    bestMonth?: string;
    bestDay?: string;
  };

  topRepos?: Array<{
    contributions: number;
    nameWithOwner?: string; // your current payload uses this
    fullName?: string; // older shape
    name?: string; // older shape
    url?: string;
  }>;

  topLanguages?: Array<{
    name: string;
    pct?: number; // your current payload uses this
    percent?: number; // older shape
    bytes?: number;
  }>;

  generatedAt?: string;
};

type WrappedErr = { error: string; message?: string };

type Wrapped = WrappedOk | WrappedErr;

type Slide =
  | { kind: "hero"; bg?: string }
  | { kind: "count"; bg?: string }
  | { kind: "persona"; bg?: string }
  | { kind: "grind"; bg?: string }
  | { kind: "repo"; which: 0 | 1; bg?: string }
  | { kind: "transition"; bg?: string }
  | { kind: "langs"; bg?: string }
  | { kind: "quote"; bg?: string }
  | { kind: "summary"; bg?: string };

function isErr(w: Wrapped): w is WrappedErr {
  return (w as WrappedErr).error !== undefined && typeof (w as WrappedErr).error === "string";
}

function safeNum(v: any, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

type TopRepo = {
  url?: string;
  contributions: number;
  nameWithOwner?: string;
};

type TopLang = {
  name: string;
  pct?: number;
  percent?: number;
  bytes?: number;
};

function repoDisplayName(r?: TopRepo) {
  if (!r) return "No repo yet";
  return r.nameWithOwner ?? "Unnamed repo";
}

function langPercent(l: TopLang) {
  const p = safeNum(l.pct, safeNum(l.percent, 0));
  return p;
}

export default function WrappedPage() {
  const params = useParams();
  const id = (params?.id as string) ?? "";

  const cardRef = useRef<HTMLDivElement | null>(null);

  const [wrapped, setWrapped] = useState<Wrapped | null>(null);
  const [index, setIndex] = useState(0);

  // Fetch data
  useEffect(() => {
    if (!id) return;

    let alive = true;

    fetch(`/api/wrapped/${id}`)
      .then(async (r) => {
        const text = await r.text();
        if (!r.ok) throw new Error(text || `Fetch failed: ${r.status}`);
        return JSON.parse(text);
      })
      .then((data) => {
        if (!alive) return;
        setWrapped(data as Wrapped);
      })
      .catch((err: any) => {
        console.error("Fetch wrapped failed:", err?.message ?? err);
        if (!alive) return;
        setWrapped({ error: "fetch_failed", message: err?.message ?? String(err) });
      });

    return () => {
      alive = false;
    };
  }, [id]);

  const slides: Slide[] = useMemo(() => {
    return [
      { kind: "hero", bg: "bg-gradient-to-br from-fuchsia-600/25 via-indigo-600/20 to-emerald-500/20" },
      { kind: "count", bg: "bg-gradient-to-br from-emerald-500/22 via-teal-500/18 to-blue-500/18" },
      { kind: "persona", bg: "bg-gradient-to-br from-violet-500/22 via-fuchsia-500/18 to-rose-500/18" },
      { kind: "grind", bg: "bg-gradient-to-br from-amber-500/20 via-orange-500/16 to-fuchsia-500/16" },
      { kind: "repo", which: 0, bg: "bg-gradient-to-br from-blue-600/22 via-cyan-500/18 to-emerald-500/18" },
      { kind: "repo", which: 1, bg: "bg-gradient-to-br from-indigo-600/22 via-purple-500/18 to-pink-500/18" },
      { kind: "transition", bg: "bg-gradient-to-br from-neutral-400/10 via-white/8 to-neutral-400/10" },
      { kind: "langs", bg: "bg-gradient-to-br from-fuchsia-600/22 via-blue-600/18 to-emerald-500/18" },
      { kind: "quote", bg: "bg-gradient-to-br from-rose-500/22 via-fuchsia-500/18 to-indigo-500/18" },
      { kind: "summary", bg: "bg-gradient-to-br from-emerald-500/18 via-blue-600/16 to-fuchsia-500/16" },
    ];
  }, []);

  const total = slides.length;
  const slide = slides[index];

  async function downloadImage(filename: string) {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }

  function copyShareLink() {
    const url = `${window.location.origin}/w/${id}`;
    navigator.clipboard.writeText(url);
  }

  if (!wrapped) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/60">Loading wrapped…</div>
      </div>
    );
  }

  if (isErr(wrapped)) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold">Couldn’t load this Wrapped</div>
          <div className="mt-2 text-white/60 text-sm">
            {wrapped.error}
            {wrapped.message ? ` — ${wrapped.message}` : ""}
          </div>
          <a className="mt-4 inline-block text-white/70 hover:text-white underline" href="/dashboard">
            Go back
          </a>
        </div>
      </div>
    );
  }

  // ---------- Normalize data (supports your current JSON + older shapes) ----------
  const login = wrapped.profile?.login ?? "you";
  const avatarUrl = wrapped.profile?.avatarUrl ?? "";
  const year = wrapped.year ?? new Date().getFullYear();

  const contributions = safeNum(wrapped.totals?.contributions, 0);

  // Active days + repos touched
  // Active days is NOT in your JSON yet, so it will show "—" unless backend provides it.
  const activeDays: number | null =
    typeof wrapped.totals?.activeDays === "number" ? wrapped.totals!.activeDays! : null;

  // Repos touched: if backend provides totals.repoCount use it; otherwise derive from topRepos length as a reasonable fallback
  const reposTouched: number | null =
    typeof wrapped.totals?.repoCount === "number"
      ? wrapped.totals!.repoCount!
      : Array.isArray(wrapped.topRepos)
      ? wrapped.topRepos.length
      : null;

  // Persona + grind
  const persona =
    wrapped.fun?.badge ??
    wrapped.vibe?.label ??
    "Commit Captain";

  const bestMonth =
    wrapped.fun?.bestMonth ??
    wrapped.vibe?.bestMonth ??
    "—";

  const bestDay =
    wrapped.fun?.bestWeekday ??
    wrapped.vibe?.bestDay ??
    "—";

  // Top repos
  const repo0 = wrapped.topRepos?.[0];
  const repo1 = wrapped.topRepos?.[1];

  // Languages
  const langsRaw = Array.isArray(wrapped.topLanguages) ? wrapped.topLanguages : [];
  const langsTop = langsRaw
    .map((l) => ({ name: l.name, pct: langPercent(l) }))
    .filter((l) => l.name)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  const quote =
    contributions >= 200
      ? "I don’t chase motivation. I build consistency."
      : contributions >= 80
      ? "Small commits. Big momentum."
      : "I showed up. I learned. I shipped.";

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-5 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <a className="text-white/60 hover:text-white transition" href="/dashboard">
            ← Home
          </a>

          {/* Only keep download — no autoplay / pause */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadImage(`github-wrapped-${id}-slide-${index + 1}.png`)}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              Download image
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="mt-6 flex items-center justify-center">
          <div ref={cardRef} className="w-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.99 }}
                transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                className="w-full flex items-center justify-center"
              >
                <SlideShell bg={slide.bg}>
                  {/* Header */}
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full overflow-hidden border border-white/10 bg-white/5">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>

                    <div>
                      <div className="font-semibold">{login}</div>
                      <div className="text-white/50 text-sm">{year} recap</div>
                    </div>

                    <div className="ml-auto text-white/40 text-sm">
                      {index + 1}/{total}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="mt-10">
                    {slide.kind === "hero" && (
                      <>
                        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight">
                          {login},
                          <br />
                          <span className="text-white/70">this was your {year}.</span>
                        </h1>
                        <p className="mt-6 text-white/60 text-lg">
                          One year. Many commits. A story worth sharing.
                        </p>
                      </>
                    )}

                    {slide.kind === "count" && (
                      <>
                        <h2 className="text-4xl md:text-6xl font-semibold tracking-tight">
                          You shipped code
                          <br />
                          <span className="text-white">
                            <CountUp value={contributions} /> times.
                          </span>
                        </h2>

                        {/* mini stats row */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <StatCard label="Active days" value={activeDays ?? "—"} />
                          <StatCard label="Repos touched" value={reposTouched ?? "—"} />
                          <StatCard label="Year" value={year} />
                        </div>

                        <p className="mt-6 text-white/60 text-lg">
                          Not perfect days. Just consistent ones.
                        </p>
                      </>
                    )}

                    {slide.kind === "persona" && (
                      <>
                        <h2 className="text-5xl md:text-7xl font-semibold tracking-tight">
                          Your developer energy:
                        </h2>
                        <div className="mt-5 text-3xl md:text-5xl font-semibold">
                          {String(persona).toUpperCase()}
                        </div>
                        <p className="mt-6 text-white/60 text-lg">A vibe built by habit.</p>
                      </>
                    )}

                    {slide.kind === "grind" && (
                      <>
                        <h2 className="text-5xl md:text-7xl font-semibold tracking-tight">
                          Your grind season.
                        </h2>
                        <p className="mt-6 text-white/70 text-xl">
                          Best month: <span className="text-white">{bestMonth}</span> • Best day:{" "}
                          <span className="text-white">{bestDay}</span>
                        </p>
                        <p className="mt-6 text-white/55 text-lg">
                          When you were locked in, you were really locked in.
                        </p>
                      </>
                    )}

                    {slide.kind === "repo" && (
                      <>
                        <h2 className="text-5xl md:text-7xl font-semibold tracking-tight">
                          {slide.which === 0 ? "Your #1 project:" : "You kept coming back to:"}
                        </h2>

                        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
                          <div className="text-2xl md:text-3xl font-semibold">
                            {slide.which === 0 ? repoDisplayName(repo0) : repoDisplayName(repo1)}
                          </div>

                          <div className="mt-3 text-white/60 text-lg">
                            {safeNum(slide.which === 0 ? repo0?.contributions : repo1?.contributions, 0)} contributions
                          </div>

                          {(slide.which === 0 ? repo0?.url : repo1?.url) ? (
                            <a
                              className="mt-3 inline-block text-white/60 hover:text-white underline text-sm"
                              href={String(slide.which === 0 ? repo0?.url : repo1?.url)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View repo
                            </a>
                          ) : null}
                        </div>

                        <p className="mt-6 text-white/55 text-lg">
                          The kind of project you don’t just “touch”… you build.
                        </p>
                      </>
                    )}

                    {slide.kind === "transition" && (
                      <>
                        <h2 className="text-5xl md:text-7xl font-semibold tracking-tight">
                          You didn’t just code.
                        </h2>
                        <p className="mt-6 text-white/70 text-xl">You explored.</p>
                        <p className="mt-6 text-white/55 text-lg">
                          New tools, new ideas, new directions.
                        </p>
                      </>
                    )}

                    {slide.kind === "langs" && (
                      <>
                        <h2 className="text-5xl md:text-7xl font-semibold tracking-tight">
                          Your languages.
                        </h2>
                        <p className="mt-4 text-white/60 text-lg">
                          Your year had a soundtrack — this was the mix.
                        </p>

                        <div className="mt-8 space-y-4">
                          {langsTop.length === 0 ? (
                            <div className="text-white/60">No language data yet.</div>
                          ) : (
                            langsTop.map((l, i) => (
                              <div key={l.name} className="flex items-center gap-4">
                                <div className="w-28 text-white/70">{l.name}</div>

                                <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(3, l.pct)}%` }}
                                    transition={{ duration: 0.7, delay: 0.1 * i }}
                                    className="h-full rounded-full bg-white/80"
                                  />
                                </div>

                                <div className="w-16 text-right text-white/60">
                                  {l.pct.toFixed(1)}%
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}

                    {slide.kind === "quote" && (
                      <>
                        <h2 className="text-2xl text-white/60">Your shareable quote</h2>
                        <div className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
                          “{quote}”
                        </div>
                        <p className="mt-8 text-white/50 text-lg">
                          Screenshot this. Make it your wallpaper.
                        </p>
                      </>
                    )}

                    {slide.kind === "summary" && (
                      <>
                        <h2 className="text-5xl md:text-7xl font-semibold tracking-tight">
                          Your {year} summary
                        </h2>
                        <p className="mt-4 text-white/60 text-lg">
                          Share this page if you want everything in one place.
                        </p>

                        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left card */}
                          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                            <div className="text-white/60">Total contributions</div>
                            <div className="mt-2 text-6xl font-semibold">{contributions}</div>

                            <div className="mt-6 grid grid-cols-2 gap-4">
                              <MiniStat label="Active days" value={activeDays ?? "—"} />
                              <MiniStat label="Repos touched" value={reposTouched ?? "—"} />
                              <MiniStat label="Vibe" value={persona || "—"} />
                              <MiniStat label="Best month/day" value={`${bestMonth} / ${bestDay}`} />
                            </div>
                          </div>

                          {/* Right card */}
                          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                            <div className="text-white/60">Top repos</div>

                            <div className="mt-4 space-y-3">
                              <RepoRow
                                name={repoDisplayName(repo0)}
                                contrib={safeNum(repo0?.contributions, 0)}
                              />
                              <RepoRow
                                name={repoDisplayName(repo1)}
                                contrib={safeNum(repo1?.contributions, 0)}
                              />
                            </div>

                            <div className="mt-8 text-white/60">Top languages</div>
                            <div className="mt-3 space-y-3">
                              {langsTop.length === 0 ? (
                                <div className="text-white/60">No language data yet.</div>
                              ) : (
                                langsTop.map((l) => (
                                  <LangRow key={l.name} name={l.name} pct={l.pct} />
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-10 flex flex-wrap gap-3">
                          <button
                            onClick={() => downloadImage(`github-wrapped-${id}-summary.png`)}
                            className="px-6 py-3 rounded-2xl bg-white text-black font-semibold hover:opacity-90 transition"
                          >
                            Download this summary
                          </button>

                          <button
                            onClick={copyShareLink}
                            className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                          >
                            Copy share link
                          </button>

                          <a
                            href="/dashboard"
                            className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                          >
                            Generate another year
                          </a>
                        </div>
                      </>
                    )}

                    <div className="mt-10 text-white/30 text-sm">
                      Generated {new Date().toLocaleString()}
                    </div>
                  </div>
                </SlideShell>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <ProgressDots total={total} index={index} onGo={(i) => setIndex(i)} />

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIndex((i) => Math.max(i - 1, 0))}
              className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              disabled={index === 0}
            >
              Back
            </button>

            <button
              onClick={() => setIndex((i) => Math.min(i + 1, total - 1))}
              className="px-6 py-3 rounded-2xl bg-white text-black font-semibold hover:opacity-90 transition"
              disabled={index === total - 1}
            >
              Next
            </button>
          </div>

          <div className="text-white/35 text-sm">
            Share:{" "}
            <span className="text-white/60">
              {typeof window !== "undefined" ? `${window.location.origin}/w/${id}` : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- small UI helpers (kept in this file) ---------- */

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-white/50 text-sm">{label}</div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-white/50 text-sm">{label}</div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}

function RepoRow({ name, contrib }: { name: string; contrib: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="font-semibold text-white/90 break-words">{name}</div>
      <div className="text-white/60">{contrib} contrib</div>
    </div>
  );
}

function LangRow({ name, pct }: { name: string; pct: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-white/80">{name}</div>
      <div className="text-white/60">{pct.toFixed(1)}%</div>
    </div>
  );
}

function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 900;

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span>{n}</span>;
}
