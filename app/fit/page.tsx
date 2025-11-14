"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OptimizeResult, Tone, Level } from "../../lib/resumeTypes";
import { StepNav } from "../components/StepNav";

interface ResumeSession {
  resume: string;
  job: string;
  tone: Tone;
  level: Level;
  result: OptimizeResult;
}

export default function FitPage() {
  const router = useRouter();
  const [session, setSession] = useState<ResumeSession | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("aiResumeSession");
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as ResumeSession;
      setSession(parsed);
    } catch {
      router.replace("/");
    }
  }, [router]);

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading fit analysis…</p>
      </main>
    );
  }

  const { result, job } = session;
  const score = result.score ?? 0;
  const fitSummary = result.fit_summary || "";
  const strengths = result.strengths || [];
  const gaps = result.gaps || [];
  const suggestions = result.suggestions || [];
  const missingKeywords = result.missing_keywords || [];

  const hasFitData =
    !!fitSummary || strengths.length > 0 || gaps.length > 0 || suggestions.length > 0;

  function handleContinue() {
    router.push("/results");
  }

  function handleBack() {
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-10 pt-8 lg:px-8">
        <StepNav current={2} />

        <header className="mb-6 flex flex-col gap-2 border-b border-slate-800/60 pb-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Analyze My Fit
          </h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Based on your resume and the job description, here&apos;s how well you match
            the role, where you&apos;re strong, and what you can improve before applying.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Left: Fit summary & details */}
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-slate-950/40">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Overall fit summary
                </h2>
                <p className="text-[11px] text-slate-400">
                  This is an AI estimate based on responsibilities and requirements in the
                  job post.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950/80 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/60">
                  {score}%
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
                  Match score
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/80 p-3 text-[13px] text-slate-200">
              {hasFitData ? (
                fitSummary || "No summary returned, but we still have strengths and gaps below."
              ) : (
                "No fit analysis returned. Try going back and running the optimization again."
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2 text-[12px]">
              {strengths.length > 0 && (
                <div className="rounded-xl bg-slate-950/80 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                    Strengths
                  </p>
                  <ul className="space-y-1 text-slate-200">
                    {strengths.slice(0, 6).map((item, idx) => (
                      <li key={idx} className="flex gap-1">
                        <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {gaps.length > 0 && (
                <div className="rounded-xl bg-slate-950/80 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                    Gaps / risks
                  </p>
                  <ul className="space-y-1 text-slate-200">
                    {gaps.slice(0, 6).map((item, idx) => (
                      <li key={idx} className="flex gap-1">
                        <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="rounded-xl bg-slate-950/80 p-3 text-[12px]">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
                  Suggestions before you apply
                </p>
                <ul className="space-y-1 text-slate-200">
                  {suggestions.slice(0, 8).map((item, idx) => (
                    <li key={idx} className="flex gap-1">
                      <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 font-medium text-slate-100 hover:bg-slate-800"
              >
                ← Back to inputs
              </button>
              <button
                type="button"
                onClick={handleContinue}
                className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white shadow-sm shadow-blue-900/40 hover:bg-blue-500"
              >
                Continue to optimized resume →
              </button>
            </div>
          </section>

          {/* Right: job summary & missing keywords */}
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-slate-950/40">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Job highlights
              </h2>
              <p className="text-[11px] text-slate-400">
                Quick view of the job description used for this analysis.
              </p>
            </div>

            <div className="max-h-40 overflow-y-auto rounded-xl bg-slate-950/80 p-3 text-[11px] text-slate-200">
              <pre className="whitespace-pre-wrap">
                {job || "No job description found."}
              </pre>
            </div>

            {missingKeywords.length > 0 && (
              <div className="rounded-xl bg-slate-950/80 p-3 text-[11px]">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-pink-300">
                  Missing keywords (ATS)
                </p>
                <p className="text-slate-200">
                  {missingKeywords.slice(0, 12).join(", ")}
                  {missingKeywords.length > 12 ? "…" : ""}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
