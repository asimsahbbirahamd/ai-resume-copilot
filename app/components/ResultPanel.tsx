"use client";

import { useState } from "react";
import type { OptimizeResult } from "../../lib/resumeTypes";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";
import jsPDF from "jspdf";

interface ResultPanelProps {
  result: OptimizeResult | null;
  copied: boolean;
  onCopy: (text: string) => void;
}

type TemplateId = "modern" | "minimal" | "corporate";

const TEMPLATE_META: {
  id: TemplateId;
  name: string;
  tag: string;
  description: string;
}[] = [
  {
    id: "modern",
    name: "Modern Professional",
    tag: "Default",
    description:
      "Bold name header with clean grey section titles and balanced spacing.",
  },
  {
    id: "minimal",
    name: "Clean ATS",
    tag: "ATS-friendly",
    description:
      "Ultra-simple typography with tight spacing and no visual noise.",
  },
  {
    id: "corporate",
    name: "Executive Blue",
    tag: "Leadership",
    description:
      "Blue section headings and a more spacious, corporate-style layout.",
  },
];

export function ResultPanel({ result, copied, onCopy }: ResultPanelProps) {
  const [activeTab, setActiveTab] = useState<"resume" | "cover">("resume");
  const [template, setTemplate] = useState<TemplateId>("modern");

  const score = result?.score ?? null;
  const missingKeywords = result?.missing_keywords ?? [];
  const optimizedText = result?.optimized_resume ?? "";
  const coverLetterText = result?.cover_letter ?? "";

  const fitSummary = result?.fit_summary ?? "";
  const strengths = result?.strengths ?? [];
  const gaps = result?.gaps ?? [];
  const suggestions = result?.suggestions ?? [];

  const hasFitData =
    !!fitSummary || strengths.length > 0 || gaps.length > 0 || suggestions.length > 0;

  const hasContent = Boolean(optimizedText || coverLetterText);
  const currentText = activeTab === "resume" ? optimizedText : coverLetterText;

  // ---------- Helpers ----------

  function splitLines(text: string): string[] {
    return text.split(/\r?\n/);
  }

  function isSectionHeading(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const upper = trimmed.toUpperCase();
    return (
      upper === "PROFESSIONAL SUMMARY" ||
      upper === "SUMMARY" ||
      upper.startsWith("CORE SKILLS") ||
      upper === "SKILLS" ||
      upper === "EXPERIENCE" ||
      upper === "WORK EXPERIENCE" ||
      upper === "EDUCATION" ||
      upper === "CERTIFICATIONS" ||
      upper === "PROJECTS" ||
      upper.endsWith(":")
    );
  }

  function headingColorForTemplate(t: TemplateId): string {
    if (t === "corporate") return "1D4ED8"; // blue-ish
    if (t === "minimal") return "000000"; // black
    return "4B5563"; // grey
  }

  function buildResumeParagraphs(text: string, tmpl: TemplateId): Paragraph[] {
    const lines = splitLines(text);
    const paragraphs: Paragraph[] = [];

    let firstNonEmptyIndex = lines.findIndex((l) => l.trim() !== "");
    if (firstNonEmptyIndex === -1) {
      return [new Paragraph({ text: "" })];
    }

    const nameLine = lines[firstNonEmptyIndex].trim();
    const maybeTitleLine =
      lines[firstNonEmptyIndex + 1] &&
      lines[firstNonEmptyIndex + 1].trim().length > 0 &&
      !isSectionHeading(lines[firstNonEmptyIndex + 1].trim())
        ? lines[firstNonEmptyIndex + 1].trim()
        : "";

    const nameSize = tmpl === "minimal" ? 44 : 56; // 22pt vs 28pt

    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: nameLine,
            bold: true,
            size: nameSize,
          }),
        ],
      })
    );

    if (maybeTitleLine) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 260 },
          children: [
            new TextRun({
              text: maybeTitleLine,
              size: 24, // 12pt
              color: tmpl === "minimal" ? "111827" : "4B5563",
            }),
          ],
        })
      );
      firstNonEmptyIndex += 2;
    } else {
      firstNonEmptyIndex += 1;
    }

    const headingColor = headingColorForTemplate(tmpl);

    for (let i = firstNonEmptyIndex; i < lines.length; i++) {
      const raw = lines[i];
      const trimmed = raw.trim();
      if (!trimmed) {
        paragraphs.push(new Paragraph({ text: "" }));
        continue;
      }

      if (isSectionHeading(trimmed)) {
        const title = trimmed.replace(/:$/, "");
        const before = tmpl === "minimal" ? 160 : 200;
        const after = tmpl === "minimal" ? 60 : 80;

        paragraphs.push(
          new Paragraph({
            spacing: { before, after },
            children: [
              new TextRun({
                text: title.toUpperCase(),
                bold: true,
                size: 24,
                color: headingColor,
              }),
            ],
          })
        );
      } else {
        paragraphs.push(
          new Paragraph({
            spacing: {
              after: tmpl === "corporate" ? 50 : 40,
            },
            children: [
              new TextRun({
                text: trimmed,
                size: tmpl === "minimal" ? 20 : 22,
              }),
            ],
          })
        );
      }
    }

    return paragraphs;
  }

  function buildCoverLetterParagraphs(
    text: string,
    tmpl: TemplateId
  ): Paragraph[] {
    const lines = splitLines(text);
    const paragraphs: Paragraph[] = [];

    for (const raw of lines) {
      const trimmed = raw.trim();
      if (!trimmed) {
        paragraphs.push(new Paragraph({ text: "" }));
        continue;
      }

      paragraphs.push(
        new Paragraph({
          spacing: { after: tmpl === "corporate" ? 140 : 120 },
          children: [
            new TextRun({
              text: trimmed,
              size: tmpl === "minimal" ? 20 : 22,
            }),
          ],
        })
      );
    }

    return paragraphs;
  }

  async function handleDownloadDocx() {
    if (!result) return;

    const textToUse = activeTab === "resume" ? optimizedText : coverLetterText;
    if (!textToUse.trim()) return;

    const isResume = activeTab === "resume";

    const paragraphs = isResume
      ? buildResumeParagraphs(textToUse, template)
      : buildCoverLetterParagraphs(textToUse, template);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      activeTab === "resume"
        ? `tailored-resume-${template}.docx`
        : `cover-letter-${template}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadPdf() {
    if (!result) return;

    const textToUse = activeTab === "resume" ? optimizedText : coverLetterText;
    if (!textToUse.trim()) return;

    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
    });

    const marginLeft = 20;
    const marginTop = 20;
    const maxWidth = 170;

    const lines = splitLines(textToUse);
    let y = marginTop;

    if (activeTab === "resume") {
      let firstNonEmptyIndex = lines.findIndex((l) => l.trim() !== "");
      if (firstNonEmptyIndex < 0) firstNonEmptyIndex = 0;

      const nameLine = (lines[firstNonEmptyIndex] || "").trim();
      const nextLine =
        (lines[firstNonEmptyIndex + 1] || "").trim() || "";

      if (nameLine) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(template === "minimal" ? 14 : 16);
        const nameWidth = doc.getTextWidth(nameLine);
        const pageWidth = doc.internal.pageSize.getWidth();
        const nameX = (pageWidth - nameWidth) / 2;
        doc.text(nameLine, nameX, y);
        y += 8;
      }

      if (nextLine && !isSectionHeading(nextLine)) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const pageWidth = doc.internal.pageSize.getWidth();
        const subtitleWidth = doc.getTextWidth(nextLine);
        const subtitleX = (pageWidth - subtitleWidth) / 2;
        doc.text(nextLine, subtitleX, y);
        y += 10;
        firstNonEmptyIndex += 2;
      } else {
        firstNonEmptyIndex += 1;
      }

      const remaining = lines.slice(firstNonEmptyIndex).join("\n");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(template === "minimal" ? 10 : 11);
      const wrapped = doc.splitTextToSize(remaining, maxWidth);
      doc.text(wrapped, marginLeft, y + 4);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const allText = lines.join("\n");
      const wrapped = doc.splitTextToSize(allText, maxWidth);
      doc.text(wrapped, marginLeft, y);
    }

    const filename =
      activeTab === "resume"
        ? `tailored-resume-${template}.pdf`
        : `cover-letter-${template}.pdf`;
    doc.save(filename);
  }

  // ---------- UI ----------

  return (
    <section className="flex h-full flex-col gap-4">
      {/* Analyze-My-Fit + template gallery container */}
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-slate-950/40 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              2. Analyze My Fit
            </h2>
            <p className="text-[11px] text-slate-400">
              See how well you match this role, where you&apos;re strong, and
              what to improve before applying.
            </p>
          </div>
          {score !== null && (
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/80 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/60">
                {score}%
              </div>
              <div className="hidden text-[11px] text-slate-300 sm:block">
                <p className="uppercase tracking-wide text-slate-500">
                  Match score
                </p>
                <p className="text-[11px]">
                  Estimated compatibility with this job.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Fit summary + strengths / gaps / suggestions */}
        {hasFitData ? (
          <div className="grid gap-3 text-[11px] md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-2 rounded-xl bg-slate-950/80 p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Overall fit summary
              </p>
              {fitSummary ? (
                <p className="text-slate-200">{fitSummary}</p>
              ) : (
                <p className="text-slate-500">
                  No fit summary returned yet. Run an optimization to see this
                  analysis.
                </p>
              )}
            </div>

            <div className="space-y-2">
              {strengths.length > 0 && (
                <div className="rounded-xl bg-slate-950/80 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                    Strengths
                  </p>
                  <ul className="space-y-1 text-slate-200">
                    {strengths.slice(0, 5).map((item, idx) => (
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
                    {gaps.slice(0, 5).map((item, idx) => (
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
              <div className="md:col-span-2 rounded-xl bg-slate-950/80 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
                  Suggestions before you apply
                </p>
                <ul className="space-y-1 text-slate-200">
                  {suggestions.slice(0, 6).map((item, idx) => (
                    <li key={idx} className="flex gap-1">
                      <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="rounded-xl bg-slate-950/80 p-3 text-[11px] text-slate-500">
            Run an optimization to see a detailed fit summary, strengths, gaps,
            and suggestions tailored to this job.
          </p>
        )}

        {/* Template gallery */}
        <div className="pt-1">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Choose export template
          </p>
          <div className="grid gap-2 text-[11px] md:grid-cols-3">
            {TEMPLATE_META.map((tpl) => {
              const isActive = tpl.id === template;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setTemplate(tpl.id)}
                  className={
                    "flex flex-col items-start rounded-xl border p-3 text-left transition-all " +
                    (isActive
                      ? "border-blue-500 bg-slate-900 shadow-md shadow-blue-900/40 scale-[1.01]"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-900/80 hover:scale-[1.01]")
                  }
                >
                  <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300">
                    <span
                      className={
                        "h-1.5 w-1.5 rounded-full " +
                        (tpl.id === "modern"
                          ? "bg-emerald-400"
                          : tpl.id === "corporate"
                          ? "bg-blue-400"
                          : "bg-slate-400")
                      }
                    />
                    <span>{tpl.tag}</span>
                  </div>
                  <p className="text-[12px] font-semibold text-slate-100">
                    {tpl.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-slate-400">
                    {tpl.description}
                  </p>
                  {isActive && (
                    <p className="mt-2 text-[10px] font-medium text-emerald-300">
                      Selected
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs + export + body */}
      <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-slate-950/40 backdrop-blur">
        {/* Tabs */}
        <div className="flex gap-2 rounded-xl bg-slate-950/80 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("resume")}
            className={
              "flex-1 rounded-lg px-3 py-1.5 font-semibold transition " +
              (activeTab === "resume"
                ? "bg-slate-800 text-slate-50"
                : "text-slate-300 hover:bg-slate-800/60")
            }
          >
            Optimized resume
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cover")}
            className={
              "flex-1 rounded-lg px-3 py-1.5 font-semibold transition " +
              (activeTab === "cover"
                ? "bg-slate-800 text-slate-50"
                : "text-slate-300 hover:bg-slate-800/60")
            }
          >
            Cover letter
          </button>
        </div>

        {/* Export buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => onCopy(currentText)}
            disabled={!currentText}
            className="rounded-lg bg-slate-800 px-3 py-1.5 font-medium text-slate-100 shadow-sm shadow-slate-950/40 transition hover:-translate-y-0.5 hover:bg-slate-700 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>

          <button
            type="button"
            onClick={handleDownloadDocx}
            disabled={!currentText}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 font-medium text-white shadow-sm shadow-emerald-900/40 transition hover:-translate-y-0.5 hover:bg-emerald-500 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download as Word (.docx)
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!currentText}
            className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white shadow-sm shadow-blue-900/40 transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download as PDF
          </button>

          {missingKeywords.length > 0 && (
            <div className="ml-auto hidden max-w-xs rounded-lg bg-slate-950/70 px-3 py-2 text-right text-[11px] text-slate-300 md:block">
              <p className="mb-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                Missing keywords
              </p>
              <p>
                {missingKeywords.slice(0, 6).join(", ")}
                {missingKeywords.length > 6 ? "…" : ""}
              </p>
            </div>
          )}
        </div>

        {/* Body preview */}
        <div className="mt-1 flex-1 overflow-hidden rounded-xl bg-slate-950/70">
          <div className="h-full max-h-[360px] overflow-y-auto p-3 text-sm text-slate-100">
            {hasContent ? (
              <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed">
                {currentText}
              </pre>
            ) : (
              <p className="text-xs text-slate-500">
                Run an optimization to see your tailored resume and cover letter
                here.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
