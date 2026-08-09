import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text, type, question } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "PDF text is required" },
        { status: 400 }
      );
    }

    // Limit text length to avoid hitting token limits (keep first \~12k chars)
    const truncatedText = text.slice(0, 12000);

    let prompt = "";

if (type === "summarize") {
  prompt = `You are a professional document assistant. 

Summarize the following document clearly and concisely.
- Use short paragraphs or clean bullet points
- Focus on the key points only
- Do not use markdown symbols like ** or #
- Write in plain, natural language

Document:
${truncatedText}`;
} else if (type === "question") {
  if (!question) {
    return NextResponse.json(
      { error: "Question is required" },
      { status: 400 }
    );
  }

  prompt = `You are a professional document assistant.

Answer the user's question based only on the document below.
- Be clear and direct
- If the answer is not in the document, say "I couldn't find that information in the document."
- Do not use markdown symbols like ** or #
- Write in plain, natural language

Document:
${truncatedText}

Question: ${question}`;
} else {
  return NextResponse.json(
    { error: "Invalid type. Use 'summarize' or 'question'" },
    { status: 400 }
  );
}

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // good quality. For higher limits use "llama-3.1-8b-instant"
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const answer = completion.choices[0]?.message?.content || "No response generated.";

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}