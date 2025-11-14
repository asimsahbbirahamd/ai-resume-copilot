"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ResumeForm } from "./components/ResumeForm";
import { StepNav } from "./components/StepNav";
import { OptimizeResult, Tone, Level } from "./lib/resumeTypes";

type Theme = "dark" | "light";

export default function Home() {
  const router = useRouter();

  const [resume, setResume] = useState<string>("");
  const [job, setJob] = useState<string>("");
  const [tone, setTone] = useState<Tone>("professional");
  const [level, setLevel] = useState<Level>("senior");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");

  const isDark = theme === "dark";

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function fillSampleData() {
    setResume(
      `Jordan Rivera
Senior Data & Applications Engineer with 6+ years in healthcare IT, HIE integrations, and clinical analytics.
- Implemented and supported HIE platforms (Orion, NextGate, HealthTerm).
- Built SQL-based clinical data snapshots and dashboards.
- Collaborated with clinicians and IT teams to improve EMR workflows.`
    );

    setJob(
      `We are seeking a Senior Clinical Applications Engineer to:
- Manage clinical integrations and HIE interfaces
- Work with SQL, data warehouses, and dashboards
- Partner with clinicians, analysts, and vendors to improve workflows
- Lead troubleshooting and optimization of EMR-related applications`
    );
  }

  async function handleOptimize() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, job, tone, level }),
      });

      const data = (await res.json()) as
        | OptimizeResult
        | { error?: string };

      if (!res.ok) {
        setError((data as any).error || "Something went wrong.");
        return;
      }

      const sessionPayload = {
        resume,
        job,
        tone,
        level,
        result: data as OptimizeResult,
      };

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "aiResumeSession",
          JSON.stringify(sessionPayload)
        );
      }

      router.push("/fit");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className={
        isDark
          ? "min-h-screen bg-slate-950 text-slate-100"
          : "min-h-screen bg-slate-50 text-slate-900"
      }
    >
      {/* top gradient bar */}
      <div
        className={
          "pointer-events-none fixed inset-x-0 top-0 h-40 " +
          (isDark
            ? "bg-gradient-to-b from-blue-500/20 to-transparent"
            : "bg-gradient-to-b from-blue-300/30 to-transparent")
        }
      />

      {/* Theme toggle fixed in corner */}
      <button
        type="button"
        onClick={toggleTheme}
        className={
          "fixed right-4 top-4 z-20 flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium " +
          (isDark
            ? "border-slate-700 bg-slate-950/80 text-slate-200 hover:bg-slate-900"
            : "border-slate-300 bg-white/90 text-slate-700 hover:bg-slate-100")
        }
      >
        {isDark ? "☀️ Light mode" : "🌙 Dark mode"}
      </button>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 lg:px-8">
        {/* Global step nav */}
        <StepNav current={1} />

        {/* Main area */}
        <div className="mt-4 grid flex-1 gap-8 lg:grid-cols-2 lg:items-center">
          {/* Left: hero / description */}
          <section className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Turn your resume into a{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                  job-specific weapon
                </span>
                .
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-300">
                Start with your current resume and the role you&apos;re
                targeting. Next we&apos;ll show your match score, strengths,
                gaps, and then generate an optimized resume &amp; cover letter.
              </p>
            </div>

            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Drag &amp; drop your resume (PDF, DOCX, TXT).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Paste a job link or description from any job board.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>
                  Then review fit analysis before you see the optimized
                  documents.
                </span>
              </li>
            </ul>

            <p className="hidden text-xs text-slate-500 sm:block">
              Flow:{" "}
              <span className="font-medium text-slate-300">
                Add resume &amp; job → Analyze My Fit → Optimized resume &amp;
                cover letter
              </span>
            </p>
          </section>

          {/* Right: form card */}
          <section className="flex justify-center">
            <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl shadow-slate-950/50 backdrop-blur">
              <div className="mb-3 flex items-center justify-between text-xs">
                <p className="font-medium text-slate-200">
                  Step 1 – Add your inputs
                </p>
                <button
                  type="button"
                  onClick={fillSampleData}
                  className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700"
                >
                  Use sample data
                </button>
              </div>

              <ResumeForm
                resume={resume}
                job={job}
                tone={tone}
                level={level}
                loading={loading}
                error={error}
                onFillSample={fillSampleData}
                onResumeChange={setResume}
                onJobChange={setJob}
                onToneChange={setTone}
                onLevelChange={setLevel}
                onSubmit={handleOptimize}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
