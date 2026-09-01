"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Props = {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
};

export function SkillsInput({ label, placeholder, tags, onChange }: Props) {
  const [value, setValue] = useState("");

  const addTag = () => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setValue("");
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-text-dark">
        {label}
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="button"
          onClick={addTag}
          className="shrink-0 rounded-md bg-surface-tertiary px-4 py-2 text-sm font-medium text-text-dark transition-colors hover:bg-border-light"
        >
          Add
        </button>
      </div>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1.5 rounded-md bg-background px-3 py-1.5 text-sm font-medium text-text-secondary"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
