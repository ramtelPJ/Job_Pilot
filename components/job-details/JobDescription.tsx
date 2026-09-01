import { FileText } from "lucide-react";

type Props = {
  description: string | null;
};

export function JobDescription({ description }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-text-secondary" />
        <h2 className="text-base font-semibold text-text-primary">Job Description</h2>
      </div>
      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
        {description ?? "No description available for this job."}
      </p>
    </div>
  );
}
