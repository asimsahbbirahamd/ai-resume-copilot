"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OptimizeResult, Tone, Level } from "../../lib/resumeTypes";
import { ResultPanel } from "../components/ResultPanel";
import { StepNav } from "../components/StepNav";

interface ResumeSession {
  resume: string;
  job: string;
  tone: Tone;
  level: Level;
  result: OptimizeResult;
}

export default function ResultsPage() {
  const router = useRouter();
  const [session, setSession] = useState<ResumeSession | null>(null);
  const [copied, setCopied] = useState(false);

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

  async function handleCopy(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading optimized results…</p>
      </main>
    );
  }

  const { result } = session;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-10 pt-8 lg:px-8">
        <StepNav current={3} />

        <header className="mb-6 border-b border-slate-800/60 pb-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Optimized resume &amp; cover letter
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">
            Review, tweak, and export your tailored resume and cover letter. You can
            always go back to adjust your inputs and re-run the optimization for a
            different job.
          </p>
        </header>

        <ResultPanel result={result} copied={copied} onCopy={handleCopy} />
      </div>
    </main>
  );
}
