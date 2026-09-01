"use client";

import { Plus, X } from "lucide-react";

import type { WorkExperienceEntry } from "@/types";

const MAX_ROLES = 3;

type Props = {
  roles: WorkExperienceEntry[];
  onChange: (roles: WorkExperienceEntry[]) => void;
};

export function WorkExperienceSection({ roles, onChange }: Props) {
  const addRole = () => {
    if (roles.length >= MAX_ROLES) return;
    onChange([
      ...roles,
      {
        companyName: "",
        jobTitle: "",
        startDate: "",
        endDate: "",
        current: false,
        responsibilities: "",
      },
    ]);
  };

  const removeRole = (index: number) => {
    onChange(roles.filter((_, i) => i !== index));
  };

  const updateRole = (index: number, patch: Partial<WorkExperienceEntry>) => {
    onChange(roles.map((role, i) => (i === index ? { ...role, ...patch } : role)));
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">
          Work Experience
        </h3>
        {roles.length < MAX_ROLES && (
          <button
            type="button"
            onClick={addRole}
            className="flex items-center gap-1 text-sm font-medium text-accent hover:opacity-80"
          >
            <Plus className="h-4 w-4" />
            Add role
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {roles.map((role, index) => (
          <div
            key={index}
            className="relative rounded-xl border border-border bg-background p-4"
          >
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeRole(index)}
                aria-label="Remove role"
                className="absolute right-4 top-4 text-text-muted hover:text-error"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-text-dark">
                  Company Name
                </label>
                <input
                  type="text"
                  value={role.companyName}
                  onChange={(e) => updateRole(index, { companyName: e.target.value })}
                  className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-text-dark">
                  Job Title
                </label>
                <input
                  type="text"
                  value={role.jobTitle}
                  onChange={(e) => updateRole(index, { jobTitle: e.target.value })}
                  className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-text-dark">
                  Start Date
                </label>
                <input
                  type="month"
                  value={role.startDate}
                  onChange={(e) => updateRole(index, { startDate: e.target.value })}
                  className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-text-dark">
                    End Date
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                    <input
                      type="checkbox"
                      checked={role.current}
                      onChange={(e) =>
                        updateRole(index, {
                          current: e.target.checked,
                          endDate: e.target.checked ? "" : role.endDate,
                        })
                      }
                      className="h-3.5 w-3.5 accent-[var(--color-accent)]"
                    />
                    Currently working here
                  </label>
                </div>
                <input
                  type="month"
                  value={role.endDate}
                  disabled={role.current}
                  onChange={(e) => updateRole(index, { endDate: e.target.value })}
                  className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-surface-secondary disabled:text-text-muted"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-dark">
                Key Responsibilities
              </label>
              <textarea
                rows={2}
                value={role.responsibilities}
                onChange={(e) => updateRole(index, { responsibilities: e.target.value })}
                className="mt-1.5 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
