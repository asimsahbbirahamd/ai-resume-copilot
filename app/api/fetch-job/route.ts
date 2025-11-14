import { NextResponse } from "next/server";

interface FetchJobBody {
  url?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FetchJobBody;
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json(
        { error: "Job URL is required." },
        { status: 400 }
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format." },
        { status: 400 }
      );
    }

    // Optional: restrict to http/https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json(
        { error: "Only http/https URLs are supported." },
        { status: 400 }
      );
    }

    // Fetch the job page
    const res = await fetch(parsed.toString(), {
      method: "GET",
      headers: {
        // some sites require a UA
        "User-Agent":
          "Mozilla/5.0 (compatible; ResumeCopilotBot/1.0; +https://example.com)",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch job page (status ${res.status}).` },
        { status: 400 }
      );
    }

    const html = await res.text();

    // super simple text extraction (MVP)
    // later you can clean HTML, remove nav, etc.
    // for now just return raw HTML and let the client or another API clean it.
    return NextResponse.json({ html });
  } catch (err) {
    console.error("fetch-job error:", err);
    return NextResponse.json(
      { error: "Unexpected server error in fetch-job." },
      { status: 500 }
    );
  }
}
