"use client";

import { useState, useEffect, type FormEvent } from "react";
import { ResumeForm } from "./components/ResumeForm";
import { ResultPanel } from "./components/ResultPanel";
import { OptimizeResult, Tone, Level } from "../lib/resumeTypes";

type Theme = "dark" | "light";
type FeedbackStatus = "idle" | "success" | "error";

export default function Home() {
  const [resume, setResume] = useState<string>("");
  const [job, setJob] = useState<string>("");
  const [tone, setTone] = useState<Tone>("professional");
  const [level, setLevel] = useState<Level>("senior");
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [theme, setTheme] = useState<Theme>("dark");

  const [feedbackName, setFeedbackName] = useState<string>("");
  const [feedbackEmail, setFeedbackEmail] = useState<string>("");
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [feedbackSending, setFeedbackSending] = useState<boolean>(false);
  const [feedbackStatus, setFeedbackStatus] =
    useState<FeedbackStatus>("idle");

  const isDark = theme === "dark";

  // 🔄 Load draft from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedResume = window.localStorage.getItem("rcp_resume");
    const savedJob = window.localStorage.getItem("rcp_job");
    if (savedResume) setResume(savedResume);
    if (savedJob) setJob(savedJob);
  }, []);

  // 💾 Persist draft to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("rcp_resume", resume);
  }, [resume]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("rcp_job", job);
  }, [job]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function scrollToSection(id: string) {
    if (typeof document === "undefined") return;
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function fillSampleData() {
    setResume(
      `Jordan Patel
Senior Product Manager with 7+ years leading cross-functional teams to ship data-driven features in SaaS and healthcare.

EXPERIENCE
Senior Product Manager – Medisphere Health (2020–Present)
- Led launch of a care-coordination module used by 3,000+ clinicians; improved task completion time by 27%.
- Partnered with engineering, design, and clinical stakeholders to deliver quarterly roadmap on time.
- Defined KPIs and dashboards in Looker; increased feature adoption from 35% to 62% within 2 quarters.

Product Manager – FlowCart Commerce (2017–2020)
- Owned checkout funnel for a Shopify-based SaaS; increased conversion by 14%.
- Ran A/B tests on pricing and packaging; improved ARPU by 9%.
- Collaborated with marketing and CS to reduce churn by 6%.

SKILLS
Roadmapping, A/B testing, Analytics, Stakeholder management, Agile, SQL (basic), JIRA, Figma
`
    );

    setJob(
      `Role: Senior Product Manager – B2B SaaS

We are looking for an experienced Product Manager to:
- Own roadmap for a core SaaS workflow product.
- Collaborate with design and engineering to ship high-impact features.
- Run experiments and A/B tests to improve conversion and retention.
- Work closely with sales and customer success to gather feedback.
- Use analytics tools (e.g. Amplitude, Looker, Mixpanel) to define and track KPIs.

Requirements:
- 5+ years of product management experience.
- Experience in B2B or SaaS products.
- Strong analytical and communication skills.
- Comfortable working with engineers and designers in an agile environment.`
    );
  }

  async function handleOptimize() {
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      const trimmedResume = resume.slice(0, 8000);
      const trimmedJob = job.slice(0, 6000);

      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: trimmedResume,
          job: trimmedJob,
          tone,
          level,
        }),
      });

      const data = await res.json();
      console.log("AI response:", data);

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setResult(data as OptimizeResult);
        // Scroll to analysis/results when ready
        scrollToSection("analysis-section");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  async function handleFeedbackSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedbackStatus("idle");

    if (!feedbackName.trim() || !feedbackMessage.trim()) {
      setFeedbackStatus("error");
      return;
    }

    try {
      setFeedbackSending(true);
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: feedbackName.trim(),
          email: feedbackEmail.trim(),
          message: feedbackMessage.trim(),
        }),
      });

      if (!res.ok) {
        setFeedbackStatus("error");
        return;
      }

      setFeedbackStatus("success");
      setFeedbackMessage("");
    } catch {
      setFeedbackStatus("error");
    } finally {
      setFeedbackSending(false);
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

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-10 pt-6 lg:px-8">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-800/60 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 text-sm font-bold shadow-sm shadow-blue-900/60">
              RC
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">
                Resume Copilot
              </h1>
              <p
                className={
                  "mt-0.5 text-xs " +
                  (isDark ? "text-slate-400" : "text-slate-600")
                }
              >
                Tailor your resume &amp; cover letter to any job in under a
                minute.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <nav
              className={
                "flex items-center gap-3 rounded-full border px-3 py-1 " +
                (isDark
                  ? "border-slate-800 bg-slate-950/60 text-slate-300"
                  : "border-slate-300 bg-white text-slate-700")
              }
            >
              <button
                type="button"
                onClick={() => scrollToSection("how-it-works")}
                className="cursor-pointer hover:text-slate-100"
              >
                How it works
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("why-better")}
                className="cursor-pointer hover:text-slate-100"
              >
                Why it&apos;s better
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("feedback")}
                className="cursor-pointer hover:text-slate-100"
              >
                Feedback
              </button>
            </nav>

            <span
              className={
                "rounded-full border px-3 py-1 font-semibold " +
                (isDark
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                  : "border-emerald-500/60 bg-emerald-100 text-emerald-700")
              }
            >
              ⚡ Powered by GPT-4o
            </span>

            <button
              type="button"
              onClick={toggleTheme}
              className={
                "flex items-center gap-1 rounded-full border px-3 py-1 font-medium " +
                (isDark
                  ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100")
              }
            >
              {isDark ? "☀️ Light mode" : "🌙 Dark mode"}
            </button>
          </div>
        </header>

        {/* Hero / steps */}
        <section id="how-it-works" className="mb-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight lg:text-3xl">
            Paste your resume and a job link.{" "}
            <span className="text-blue-400">
              Get a tailored version + fit analysis.
            </span>
          </h2>
          <p
            className={
              "mx-auto mt-2 max-w-2xl text-sm " +
              (isDark ? "text-slate-300" : "text-slate-600")
            }
          >
            We rewrite your resume, generate a matching cover letter, and break
            down your strengths, gaps, and concrete next steps for this role.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
            <div className="flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1.5 text-slate-200 shadow-sm shadow-slate-950/40">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] font-semibold">
                1
              </span>
              <span>Paste or upload your resume</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1.5 text-slate-200 shadow-sm shadow-slate-950/40">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] font-semibold">
                2
              </span>
              <span>Paste job description or link</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1.5 text-slate-200 shadow-sm shadow-slate-950/40">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] font-semibold">
                3
              </span>
              <span>
                Let AI tailor resume, cover letter &amp; fit analysis
              </span>
            </div>
          </div>
        </section>

        {/* Main layout: left form, right results */}
        <section
          id="analysis-section"
          className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-2"
        >
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

          <ResultPanel
            result={result}
            copied={copied}
            onCopy={handleCopy}
          />
        </section>

        {/* Why it's better section */}
        <section
          id="why-better"
          className="mt-10 grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200 lg:grid-cols-3"
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Not just keyword stuffing
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Most resume tools only inject keywords. We highlight your actual
              strengths and explain where you&apos;re a strong fit vs. where
              recruiters may hesitate.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Fit analysis you can act on
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              You get a match score, strengths, gaps, and concrete suggestions
              so you know exactly what to improve before applying.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Resume + cover letter in one pass
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              The same context powers both your resume and cover letter, keeping
              your story consistent and tailored to the role.
            </p>
          </div>
        </section>

        {/* Feedback section */}
        <section
          id="feedback"
          className="mt-10 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm"
        >
          <h3 className="text-sm font-semibold text-slate-100">
            Help us make this better
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            This is an early version. If something feels confusing or you&apos;d
            love to see a specific feature, tell us here.
          </p>

          <form
            onSubmit={handleFeedbackSubmit}
            className="mt-3 grid gap-3 text-xs sm:grid-cols-2"
          >
            <div className="sm:col-span-1">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Name
              </label>
              <input
                type="text"
                value={feedbackName}
                onChange={(e) => {
                  setFeedbackName(e.target.value);
                  setFeedbackStatus("idle");
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                placeholder="How should we address you?"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Email (optional)
              </label>
              <input
                type="email"
                value={feedbackEmail}
                onChange={(e) => {
                  setFeedbackEmail(e.target.value);
                  setFeedbackStatus("idle");
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                placeholder="If you want a reply…"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Feedback
              </label>
              <textarea
                rows={3}
                value={feedbackMessage}
                onChange={(e) => {
                  setFeedbackMessage(e.target.value);
                  setFeedbackStatus("idle");
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                placeholder="Tell us what worked well, what broke, or what you wish this tool could do."
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between gap-3">
              <button
                type="submit"
                disabled={feedbackSending || !feedbackName.trim() || !feedbackMessage.trim()}
                className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm shadow-slate-900/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {feedbackSending ? "Sending…" : "Send feedback"}
              </button>

              {feedbackStatus === "success" && (
                <p className="text-[11px] text-emerald-300">
                  Thanks! Your feedback was sent.
                </p>
              )}
              {feedbackStatus === "error" && (
                <p className="text-[11px] text-amber-300">
                  Couldn&apos;t send feedback. You can try again in a moment.
                </p>
              )}
            </div>
          </form>
        </section>

        {/* Small privacy / reassurance footer */}
        <footer className="mt-6 border-t border-slate-800/60 pt-3 text-xs text-slate-500">
          <p>
            We don&apos;t persist your resume or job description on our servers
            in this early version. Text is sent to OpenAI only for generating
            suggestions.
          </p>
        </footer>
      </div>
    </main>
  );
}
