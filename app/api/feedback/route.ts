import { NextResponse } from "next/server";

interface FeedbackBody {
  name?: string;
  email?: string;
  message?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FeedbackBody;
    const { name, email, message } = body;

    if (!name || !message) {
      return NextResponse.json(
        { error: "Name and message are required." },
        { status: 400 }
      );
    }

    // For now we just log it.
    // Later you could forward this to email, Slack, Notion, etc.
    console.log("✨ New feedback:", {
      name,
      email: email ?? null,
      message,
      at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Feedback error:", err);
    return NextResponse.json(
      { error: "Failed to submit feedback." },
      { status: 500 }
    );
  }
}
