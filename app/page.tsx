"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    text: string;
    pages: number;
    fileName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [showQuestionInput, setShowQuestionInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a valid PDF file");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
    setAiAnswer(null);
    setShowQuestionInput(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setAiAnswer(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult({
        text: data.text,
        pages: data.pages,
        fileName: data.fileName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract text");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const callAI = async (type: "summarize" | "question") => {
    if (!result) return;

    setAiLoading(true);
    setAiAnswer(null);
    setError(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: result.text,
          type,
          question: type === "question" ? question : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI request failed");
      }

      setAiAnswer(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setAiLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setCopied(false);
    setAiAnswer(null);
    setQuestion("");
    setShowQuestionInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Pxtor</h1>
          {result && (
            <button
              onClick={reset}
              className="text-sm text-blue-600 font-medium active:opacity-70"
            >
              New File
            </button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Upload Area */}
        {!result && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-white"
            }`}
          >
            <div className="space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <div>
                <p className="text-base font-medium">Upload your PDF</p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag & drop or tap to select
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl active:scale-95 transition-transform cursor-pointer"
              >
                Choose File
              </label>
            </div>
          </div>
        )}

        {/* Selected File Card */}
        {file && !result && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 font-bold text-sm">PDF</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={loading}
              className="mt-4 w-full py-3 bg-blue-600 text-white font-medium rounded-xl active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Extracting...
                </>
              ) : (
                "Extract Text"
              )}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm truncate pr-2">
                  {result.fileName}
                </p>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {result.pages} page{result.pages > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* AI Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => callAI("summarize")}
                disabled={aiLoading}
                className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl active:scale-[0.98] transition-transform disabled:opacity-60"
              >
                {aiLoading ? "Thinking..." : "Summarize"}
              </button>
              <button
                onClick={() => setShowQuestionInput(!showQuestionInput)}
                className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-xl active:scale-[0.98] transition-transform"
              >
                Ask Question
              </button>
            </div>

            {/* Question Input */}
            {showQuestionInput && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask anything about this PDF..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => callAI("question")}
                  disabled={aiLoading || !question.trim()}
                  className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl disabled:opacity-50"
                >
                  {aiLoading ? "Thinking..." : "Get Answer"}
                </button>
              </div>
            )}

            {/* AI Answer */}
{aiAnswer && (
  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
    <h3 className="text-sm font-semibold text-indigo-900 mb-2">
      AI Response
    </h3>
    <div className="prose prose-sm prose-indigo max-w-none text-indigo-900">
      <ReactMarkdown>{aiAnswer}</ReactMarkdown>
    </div>
  </div>
)}

            {/* Extracted Text */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-medium text-sm">Extracted Text</h2>
                <button
                  onClick={handleCopy}
                  className="text-xs font-medium text-blue-600 active:opacity-70"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="p-4 max-h-[50vh] overflow-y-auto">
                {result.text ? (
                  <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                    {result.text}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    No extractable text found in this PDF.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-gray-200 bg-white mt-10">
  <div className="max-w-lg mx-auto px-4 py-6 text-center">
    <p className="text-sm text-gray-500">
      © {new Date().getFullYear()} Nattix Technologies
    </p>
  </div>
</footer>
    </main>
  );
}