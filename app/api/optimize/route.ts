import { NextResponse } from "next/server";
import type { OptimizeResult } from "../../../lib/resumeTypes";

interface OpenAIChoice {
  message?: {
    content?: string;
  };
}

interface OpenAIChatResponse {
  choices?: OpenAIChoice[];
}

interface OptimizeJsonShape {
  score?: number;
  missing_keywords?: unknown;
  optimized_resume?: unknown;
  cover_letter?: unknown;
  fit_summary?: unknown;
  strengths?: unknown;
  gaps?: unknown;
  suggestions?: unknown;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      resume,
      job,
      tone,
      level,
    } = body as {
      resume?: string;
      job?: string;
      tone?: string;
      level?: string;
    };

    if (!resume || !job) {
      return NextResponse.json(
        { error: "Resume and job description are required." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not set on the server." },
        { status: 500 }
      );
    }

    const toneText = tone || "professional";
    const levelText = level || "mid";

    const prompt = `
You are an expert resume writer, ATS optimization specialist, and career coach.

Target tone: ${toneText}
Target seniority level: ${levelText} (entry, mid, senior, or lead-level profile).

Job description:
---
${job}
---

Candidate resume:
---
${resume}
---

Your tasks:
1. Analyze how well the resume matches the job description.
2. Return an ATS-style match score from 0 to 100 (integer).
3. Identify important skills, tools, or keywords from the job description that are missing or weak in the resume.
4. Rewrite the resume so it is strongly tailored to this job and seniority level while remaining truthful to the candidate.
5. Use the requested tone ("${toneText}") throughout your writing.
6. Generate a tailored cover letter for this job and candidate using the same tone and seniority level.

Analyze-my-fit section:
7. Produce a short "fit_summary" (2–4 sentences) explaining how well this profile fits the role.
8. Provide 3–6 bullet "strengths" where the candidate seems to match or exceed the requirements.
9. Provide 3–6 bullet "gaps" where they are weaker, missing experience, or under-qualified.
10. Provide 3–6 bullet "suggestions" with concrete, actionable steps (e.g. specific projects, metrics to highlight, or skills to build) that would improve their fit.

Rules for the rewritten resume:
- Use clear sections: SUMMARY, EXPERIENCE, SKILLS, EDUCATION.
- Use strong action verbs and, where possible, quantifiable impact.
- Adjust scope and responsibility to match ${levelText}-level expectations.
- Keep it ATS-friendly: plain text, no tables, columns, or fancy formatting.

Rules for the cover letter:
- 3–5 short paragraphs.
- Directly reference the role and key requirements from the job description.
- Highlight the most relevant experience from the resume.
- Keep it clear, specific, and in the same tone ("${toneText}").

Return ONLY valid JSON in this exact format:
{
  "score": number,
  "missing_keywords": string[],
  "optimized_resume": string,
  "cover_letter": string,
  "fit_summary": string,
  "strengths": string[],
  "gaps": string[],
  "suggestions": string[]
}
Do not include any explanation text outside this JSON.
`;

    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You optimize resumes and cover letters for specific job descriptions and must respond ONLY with valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error("OpenAI API error:", text);
      return NextResponse.json(
        { error: "OpenAI API request failed." },
        { status: 500 }
      );
    }

    const data = (await apiRes.json()) as OpenAIChatResponse;

    const content =
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
        ? data.choices[0].message.content
        : "";

    if (!content) {
      return NextResponse.json(
        { error: "No content returned from OpenAI." },
        { status: 500 }
      );
    }

    let parsed: OptimizeJsonShape;
    try {
      parsed = JSON.parse(content) as OptimizeJsonShape;
    } catch (error) {
      console.error("JSON parse error:", error, content);
      const fallback: OptimizeResult = {
        score: 0,
        missing_keywords: [],
        optimized_resume: content.trim(),
        cover_letter: "",
        fit_summary: "",
        strengths: [],
        gaps: [],
        suggestions: [],
      };
      return NextResponse.json(fallback, { status: 200 });
    }

    const scoreValue = typeof parsed.score === "number" ? parsed.score : 0;
    const score =
      Number.isFinite(scoreValue) && scoreValue >= 0 && scoreValue <= 100
        ? Math.round(scoreValue)
        : 0;

    const missing_keywords = toStringArray(parsed.missing_keywords);
    const optimized_resume =
      typeof parsed.optimized_resume === "string"
        ? parsed.optimized_resume.trim()
        : "";
    const cover_letter =
      typeof parsed.cover_letter === "string"
        ? parsed.cover_letter.trim()
        : "";

    const fit_summary =
      typeof parsed.fit_summary === "string"
        ? parsed.fit_summary.trim()
        : "";

    const strengths = toStringArray(parsed.strengths);
    const gaps = toStringArray(parsed.gaps);
    const suggestions = toStringArray(parsed.suggestions);

    const result: OptimizeResult = {
      score,
      missing_keywords,
      optimized_resume,
      cover_letter,
      fit_summary,
      strengths,
      gaps,
      suggestions,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
