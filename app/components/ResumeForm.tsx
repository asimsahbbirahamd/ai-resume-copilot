"use client";

import { useRef, useState } from "react";
import { Tone, Level } from "../../lib/resumeTypes";

interface ResumeFormProps {
  resume: string;
  job: string;
  tone: Tone;
  level: Level;
  loading: boolean;
  error: string | null;
  onFillSample: () => void;
  onResumeChange: (value: string) => void;
  onJobChange: (value: string) => void;
  onToneChange: (value: Tone) => void;
  onLevelChange: (value: Level) => void;
  onSubmit: () => void;
}

export function ResumeForm(props: ResumeFormProps) {
  const {
    resume,
    job,
    tone,
    level,
    loading,
    error,
    onFillSample,
    onResumeChange,
    onJobChange,
    onToneChange,
    onLevelChange,
    onSubmit,
  } = props;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [jobUrl, setJobUrl] = useState("");
  const [jobUrlError, setJobUrlError] = useState<string | null>(null);
  const [jobUrlLoading, setJobUrlLoading] = useState(false);

  // ---------- File upload handlers (resume) ----------

  function handleFileFromInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    readResumeFile(file);
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    readResumeFile(file);
  }

  async function readResumeFile(file: File) {
    setUploadError(null);

    const fileName = file.name.toLowerCase();

    // If it's plain text, parse on client
    if (file.type === "text/plain" || fileName.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        onResumeChange(text);
      };
      reader.onerror = () => {
        setUploadError("Could not read the file. Please try again.");
      };
      reader.readAsText(file);
      return;
    }

    // For PDF / DOCX → send to backend parser
    if (fileName.endsWith(".pdf") || fileName.endsWith(".docx")) {
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });

        const data: { text?: string; error?: string } = await res.json();
        if (!res.ok) {
          setUploadError(data.error || "Failed to parse resume.");
        } else {
          onResumeChange(String(data.text ?? ""));
        }
      } catch {
        setUploadError("Network error while uploading. Please try again.");
      } finally {
        setUploading(false);
      }
      return;
    }

    setUploadError(
      "Unsupported file type. Please upload a .pdf, .docx, or .txt file."
    );
  }

  // ---------- Job URL → Fetch description ----------

  async function handleFetchJobFromUrl() {
    setJobUrlError(null);

    const trimmed = jobUrl.trim();
    if (!trimmed) {
      setJobUrlError("Please paste a job link first.");
      return;
    }

    setJobUrlLoading(true);
    try {
      const res = await fetch("/api/fetch-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data: { jobDescription?: string; error?: string } = await res.json();

      if (!res.ok) {
        setJobUrlError(data.error || "Could not fetch job description.");
      } else {
        const text = data.jobDescription ?? "";
        if (!text) {
          setJobUrlError("No text found on that page.");
        } else {
          onJobChange(text);
        }
      }
    } catch {
      setJobUrlError("Network error while fetching job. Please try again.");
    } finally {
      setJobUrlLoading(false);
    }
  }

  // ---------- UI ----------

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-slate-900/40 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-100">
          1. Provide your resume & job
        </h2>
        <button
          type="button"
          onClick={onFillSample}
          className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700"
        >
          Use sample resume &amp; job
        </button>
      </div>

      {/* Tone & Level controls */}
      <div className="flex flex-wrap gap-3 rounded-xl bg-slate-900/80 p-3 text-xs">
        <div className="flex-1 min-w-[140px]">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Tone
          </label>
          <select
            value={tone}
            onChange={(e) => onToneChange(e.target.value as Tone)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-[12px] text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="professional">Professional</option>
            <option value="concise">Concise</option>
            <option value="friendly">Friendly</option>
            <option value="technical">Technical</option>
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Seniority level
          </label>
          <select
            value={level}
            onChange={(e) => onLevelChange(e.target.value as Level)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-[12px] text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="entry">Entry</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
          </select>
        </div>
      </div>

      {/* Upload / drag & drop area for resume */}
      <div className="space-y-2 text-xs">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center " +
            (isDragOver
              ? "border-blue-400 bg-slate-800/70"
              : "border-slate-700 bg-slate-900/80 hover:border-slate-500")
          }
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="text-[11px] font-semibold text-slate-200">
            Drag &amp; drop your resume file here, or click to browse
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Supported:{" "}
            <span className="font-medium text-slate-200">
              .pdf, .docx, .txt
            </span>
            . We&apos;ll extract the text automatically so you can edit it.
          </p>
          {uploading && (
            <p className="mt-2 text-[11px] text-blue-300">
              Uploading &amp; reading your file...
            </p>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="hidden"
          onChange={handleFileFromInput}
        />

        {uploadError && (
          <p className="text-[11px] text-amber-300">{uploadError}</p>
        )}
      </div>

      <div className="space-y-3">
        {/* Resume text area */}
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
            Your Resume (editable)
          </label>
          <textarea
            className="w-full rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
            rows={8}
            value={resume}
            onChange={(e) => onResumeChange(e.target.value)}
            placeholder="Paste or upload your resume here..."
          />
        </div>

        {/* Job URL + description */}
        <div className="space-y-2">
          <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Job link (optional)
              </label>
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="Paste a job posting URL (LinkedIn, company site, etc.)"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-[12px] text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <button
              type="button"
              onClick={handleFetchJobFromUrl}
              disabled={!jobUrl.trim() || jobUrlLoading}
              className="mt-1 inline-flex items-center justify-center rounded-xl bg-slate-800 px-3 py-2 text-[11px] font-semibold text-slate-100 shadow-sm shadow-slate-950/40 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-6"
            >
              {jobUrlLoading ? "Fetching…" : "Fetch description"}
            </button>
          </div>
          {jobUrlError && (
            <p className="text-[11px] text-amber-300">{jobUrlError}</p>
          )}
        </div>

        {/* Job description textarea */}
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
            Job Description
          </label>
          <textarea
            className="w-full rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
            rows={8}
            value={job}
            onChange={(e) => onJobChange(e.target.value)}
            placeholder="Paste the job description or fetch it from a job link above..."
          />
        </div>
      </div>

      <div className="pt-1">
        <button
          onClick={onSubmit}
          disabled={!resume || !job || loading}
          className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-900/40 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Optimizing with AI..." : "Optimize resume with AI"}
        </button>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        {!error && !loading && (
          <p className="mt-2 text-xs text-slate-400">
            Tip: Upload your resume, fetch the job description from a link, then
            let AI tailor everything for that role.
          </p>
        )}
      </div>
    </section>
  );
}
