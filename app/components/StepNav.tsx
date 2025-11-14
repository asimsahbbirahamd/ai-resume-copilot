"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface StepNavProps {
  current: 1 | 2 | 3;
}

export function StepNav({ current }: StepNavProps) {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem("aiResumeSession");
    setHasSession(Boolean(raw));
  }, []);

  const baseClasses =
    "flex-1 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition";
  const labelClasses = "flex flex-col";

  function stepDot(active: boolean, done: boolean) {
    if (active) {
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white shadow-sm shadow-blue-900/50">
          {current}
        </span>
      );
    }
    if (done) {
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[12px] font-semibold text-white">
          ✓
        </span>
      );
    }
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-600 text-[11px] text-slate-400">
        •
      </span>
    );
  }

  const step1Active = current === 1;
  const step2Active = current === 2;
  const step3Active = current === 3;

  const step1Done = current > 1;
  const step2Done = current > 2;

  return (
    <nav className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-slate-100 shadow-sm shadow-slate-950/50">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-slate-100">
            Resume Copilot
          </span>
          <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
            Beta
          </span>
        </div>
        <span className="hidden sm:inline">
          {current === 1 && "Step 1 of 3 – Add your resume & job"}
          {current === 2 && "Step 2 of 3 – Analyze your fit"}
          {current === 3 && "Step 3 of 3 – Review & export"}
        </span>
      </div>

      <div className="flex gap-2 text-[11px]">
        {/* Step 1 */}
        <Link
          href="/"
          className={
            baseClasses +
            " " +
            (step1Active
              ? "bg-slate-800 text-slate-50"
              : step1Done
              ? "bg-slate-900 text-slate-100 hover:bg-slate-800"
              : "bg-slate-950 text-slate-400 hover:bg-slate-900")
          }
        >
          {stepDot(step1Active, step1Done)}
          <div className={labelClasses}>
            <span className="uppercase tracking-wide text-[10px]">
              Step 1
            </span>
            <span>Add resume & job</span>
          </div>
        </Link>

        {/* Step 2 */}
        {hasSession ? (
          <Link
            href="/fit"
            className={
              baseClasses +
              " " +
              (step2Active
                ? "bg-slate-800 text-slate-50"
                : step2Done
                ? "bg-slate-900 text-slate-100 hover:bg-slate-800"
                : "bg-slate-950 text-slate-400 hover:bg-slate-900")
            }
          >
            {stepDot(step2Active, step2Done)}
            <div className={labelClasses}>
              <span className="uppercase tracking-wide text-[10px]">
                Step 2
              </span>
              <span>Analyze my fit</span>
            </div>
          </Link>
        ) : (
          <div
            className={
              baseClasses +
              " bg-slate-950/80 text-slate-500 opacity-60 cursor-not-allowed"
            }
          >
            {stepDot(false, false)}
            <div className={labelClasses}>
              <span className="uppercase tracking-wide text-[10px]">
                Step 2
              </span>
              <span>Analyze my fit</span>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {hasSession ? (
          <Link
            href="/results"
            className={
              baseClasses +
              " " +
              (step3Active
                ? "bg-slate-800 text-slate-50"
                : "bg-slate-950 text-slate-400 hover:bg-slate-900")
            }
          >
            {stepDot(step3Active, false)}
            <div className={labelClasses}>
              <span className="uppercase tracking-wide text-[10px]">
                Step 3
              </span>
              <span>Optimized resume</span>
            </div>
          </Link>
        ) : (
          <div
            className={
              baseClasses +
              " bg-slate-950/80 text-slate-500 opacity-60 cursor-not-allowed"
            }
          >
            {stepDot(false, false)}
            <div className={labelClasses}>
              <span className="uppercase tracking-wide text-[10px]">
                Step 3
              </span>
              <span>Optimized resume</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
