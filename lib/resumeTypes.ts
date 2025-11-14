export type Tone = "professional" | "concise" | "friendly" | "technical";

export type Level = "entry" | "mid" | "senior" | "lead";

export interface OptimizeResult {
  score: number;
  missing_keywords: string[];
  optimized_resume: string;
  cover_letter: string;

  // New Analyze-My-Fit fields
  fit_summary?: string;
  strengths?: string[];
  gaps?: string[];
  suggestions?: string[];
}
