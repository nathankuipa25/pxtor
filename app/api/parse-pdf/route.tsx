import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    // Validation
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 413 }
      );
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Extract text
    const pdf = await getDocumentProxy(buffer);
    const { totalPages, text } = await extractText(pdf, {
      mergePages: true,
    });

    return NextResponse.json({
      success: true,
      pages: totalPages,
      text: text.trim(),
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("PDF parsing error:", error);

    return NextResponse.json(
      {
        error: "Failed to parse PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}