"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileText, File as FileIcon } from "lucide-react";

import { insforge } from "@/lib/insforge-client";

type Props = {
  userId: string;
  resumePdfUrl: string | null;
  onFileSelected: (file: File | null) => void;
  onExtractClick: () => void;
  isExtracting: boolean;
  extractError: string | null;
  onGenerateClick: () => void;
  isGenerating: boolean;
  generateError: string | null;
};

export function ResumeUpload({
  userId,
  resumePdfUrl,
  onFileSelected,
  onExtractClick,
  isExtracting,
  extractError,
  onGenerateClick,
  isGenerating,
  generateError,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [isViewing, setIsViewing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleViewResume = async () => {
    setViewError(null);
    setIsViewing(true);
    try {
      // The `resumes` bucket is private — its object URL requires a bearer
      // token on every request, so a plain <a href> 401s. Fetch it through
      // the authenticated SDK instead, which attaches the access-token cookie.
      const { data: blob, error } = await insforge.storage
        .from("resumes")
        .download(`${userId}/resume.pdf`);

      if (error || !blob) {
        setViewError("Could not open your resume. Please try again.");
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    } catch {
      setViewError("Could not open your resume. Please try again.");
    } finally {
      setIsViewing(false);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf") return;
    setSelectedFileName(file.name);
    onFileSelected(file);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="text-base font-semibold text-text-primary">Resume</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Upload an existing resume to auto-fill the profile, or generate a new
        tailored one from your details below.
      </p>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`mt-4 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragging
            ? "border-accent bg-accent-muted"
            : "border-border-muted bg-surface-secondary"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          {selectedFileName ? (
            <FileIcon className="h-5 w-5 text-accent" />
          ) : (
            <UploadCloud className="h-5 w-5 text-accent" />
          )}
        </span>
        <p className="mt-4 text-sm font-semibold text-text-primary">
          {selectedFileName ?? "Click to upload or drag and drop"}
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          {selectedFileName
            ? "Selected — click Save Profile to upload."
            : "PDF formatting only. Maximum file size 5MB."}
        </p>
        <span className="mt-4 rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary">
          Select Resume
        </span>
      </button>

      {selectedFileName && (
        <div className="mt-3">
          <button
            type="button"
            onClick={onExtractClick}
            disabled={isExtracting}
            className="flex items-center gap-1.5 text-sm font-medium text-accent hover:opacity-80 disabled:opacity-60"
          >
            <FileText className="h-3.5 w-3.5" />
            {isExtracting ? "Reading resume..." : "Extract from Resume"}
          </button>
          {extractError && <p className="mt-1 text-sm text-error">{extractError}</p>}
        </div>
      )}

      {resumePdfUrl && !selectedFileName && (
        <>
          <button
            type="button"
            onClick={handleViewResume}
            disabled={isViewing}
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-accent hover:opacity-80 disabled:opacity-60"
          >
            <FileIcon className="h-3.5 w-3.5" />
            {isViewing ? "Opening..." : "View current resume"}
          </button>
          {viewError && <p className="mt-1 text-sm text-error">{viewError}</p>}
        </>
      )}

      <div className="mt-4 border-t border-border-light pt-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-text-secondary">
            Need a fresh document based on the fields below?
          </p>
          <button
            type="button"
            onClick={onGenerateClick}
            disabled={isGenerating}
            className="flex shrink-0 items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <FileText className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Resume from Profile"}
          </button>
        </div>
        {generateError && <p className="mt-2 text-sm text-error">{generateError}</p>}
      </div>
    </div>
  );
}
