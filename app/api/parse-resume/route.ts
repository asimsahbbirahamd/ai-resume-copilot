import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded." },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = "";

    // DOCX → use mammoth
    if (fileName.endsWith(".docx")) {
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
      text = result?.value ?? "";
    }
    // TXT → just decode
    else if (fileName.endsWith(".txt")) {
      text = buffer.toString("utf8");
    }
    // Everything else (including PDF) → unsupported
    else {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload a .docx or .txt file. For PDFs, export to DOCX or TXT and upload that.",
        },
        { status: 400 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract any text from the file." },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error parsing resume:", error);
    return NextResponse.json(
      { error: "Failed to parse the resume file." },
      { status: 500 }
    );
  }
}
