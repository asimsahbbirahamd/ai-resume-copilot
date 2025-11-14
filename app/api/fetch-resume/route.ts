import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string };

    const url = body?.url;
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid URL is required." },
        { status: 400 }
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "That does not look like a valid URL." },
        { status: 400 }
      );
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json(
        { error: "Only http/https links are supported." },
        { status: 400 }
      );
    }

    const res = await fetch(parsed.toString());

    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not fetch that URL (status ${res.status}).` },
        { status: 400 }
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    const pathLower = parsed.pathname.toLowerCase();

    // 1) Plain text (.txt or text/plain)
    if (contentType.includes("text/plain") || pathLower.endsWith(".txt")) {
      const text = await res.text();
      if (!text.trim()) {
        return NextResponse.json(
          { error: "The file at that URL seems to be empty." },
          { status: 400 }
        );
      }
      return NextResponse.json({ text });
    }

    // 2) DOCX (Word) via mammoth
    if (
      contentType.includes(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) ||
      pathLower.endsWith(".docx")
    ) {
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const mammothModule: any = await import("mammoth");
      const extractRawText =
        mammothModule.extractRawText ??
        mammothModule.default?.extractRawText;

      if (typeof extractRawText !== "function") {
        console.error("mammoth module shape:", mammothModule);
        return NextResponse.json(
          { error: "Could not initialize DOCX parser." },
          { status: 500 }
        );
      }

      const result = await extractRawText({ buffer });
      const text = result?.value ?? "";

      if (!text.trim()) {
        return NextResponse.json(
          { error: "Could not extract text from that DOCX file." },
          { status: 400 }
        );
      }

      return NextResponse.json({ text });
    }

    // 3) PDF → not supported yet
    if (contentType.includes("application/pdf") || pathLower.endsWith(".pdf")) {
      return NextResponse.json(
        {
          error:
            "PDF links are not supported yet. Please download the resume, export/save it as a .docx or .txt file, and upload that instead.",
        },
        { status: 400 }
      );
    }

    // 4) Anything else
    return NextResponse.json(
      {
        error:
          "Unsupported file type at that URL. Please use a direct .docx or .txt link.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching resume from URL:", error);
    return NextResponse.json(
      { error: "Failed to fetch resume from that link." },
      { status: 500 }
    );
  }
}
