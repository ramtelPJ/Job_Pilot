"use client";

import { useState, useTransition } from "react";

import { saveProfile } from "@/actions/profile";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import { SkillsInput } from "@/components/profile/SkillsInput";
import { WorkExperienceSection } from "@/components/profile/WorkExperienceSection";
import type { Profile } from "@/types";

type FieldProps = {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
};

function Field({ label, value, onChange, placeholder, readOnly, type = "text" }: FieldProps) {
  const isFilled = value.trim().length > 0;
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-text-dark">
        {label}
      </label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={`mt-1.5 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent ${
          readOnly ? "cursor-not-allowed" : ""
        } ${isFilled ? "bg-surface-secondary" : "bg-surface"}`}
      />
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
};

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-text-dark">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const WORK_AUTHORIZATION_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "citizen", label: "Citizen" },
  { value: "permanent_resident", label: "Permanent Resident" },
  { value: "visa_required", label: "Visa Required" },
];

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
];

const DEGREE_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "high_school", label: "High School" },
  { value: "associate", label: "Associate Degree" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate" },
];

const REMOTE_PREFERENCE_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "remote", label: "Remote" },
  { value: "onsite", label: "Onsite" },
  { value: "hybrid", label: "Hybrid" },
  { value: "any", label: "Any" },
];

type ExtractedProfile = {
  fullName: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  currentTitle: string | null;
  experienceLevel: string | null;
  yearsExperience: number | null;
  skills: string[];
  industries: string[];
  workExperience: Profile["workExperience"];
  education: {
    highestDegree: string | null;
    fieldOfStudy: string | null;
    institutionName: string | null;
    graduationYear: string | null;
  };
  jobTitlesSeeking: string | null;
};

type Props = {
  initialProfile: Profile;
};

export function ProfileForm({ initialProfile }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeKey, setResumeKey] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch("/api/resume/generate", { method: "POST" });
      const result: { success: boolean; resumePdfUrl?: string; error?: string } =
        await response.json();

      if (!result.success || !result.resumePdfUrl) {
        setGenerateError(result.error ?? "Could not generate a resume.");
        return;
      }

      setProfile((prev) => ({ ...prev, resumePdfUrl: result.resumePdfUrl ?? prev.resumePdfUrl }));
      setResumeKey((k) => k + 1);
    } catch {
      setGenerateError("Could not generate a resume. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtract = async () => {
    if (!resumeFile) return;
    setIsExtracting(true);
    setExtractError(null);

    try {
      const formData = new FormData();
      formData.set("resumeFile", resumeFile);

      const response = await fetch("/api/resume/extract", {
        method: "POST",
        body: formData,
      });
      const result: { success: boolean; data?: ExtractedProfile; error?: string } =
        await response.json();

      if (!result.success || !result.data) {
        setExtractError(result.error ?? "Could not extract resume data.");
        return;
      }

      const extracted = result.data;
      setProfile((prev) => ({
        ...prev,
        fullName: extracted.fullName || prev.fullName,
        phone: extracted.phone || prev.phone,
        location: extracted.location || prev.location,
        linkedinUrl: extracted.linkedinUrl || prev.linkedinUrl,
        portfolioUrl: extracted.portfolioUrl || prev.portfolioUrl,
        currentTitle: extracted.currentTitle || prev.currentTitle,
        experienceLevel: extracted.experienceLevel || prev.experienceLevel,
        yearsExperience:
          extracted.yearsExperience != null
            ? String(extracted.yearsExperience)
            : prev.yearsExperience,
        skills: extracted.skills.length > 0 ? extracted.skills : prev.skills,
        industries: extracted.industries.length > 0 ? extracted.industries : prev.industries,
        workExperience:
          extracted.workExperience.length > 0 ? extracted.workExperience : prev.workExperience,
        education: {
          highestDegree: extracted.education.highestDegree || prev.education.highestDegree,
          fieldOfStudy: extracted.education.fieldOfStudy || prev.education.fieldOfStudy,
          institutionName:
            extracted.education.institutionName || prev.education.institutionName,
          graduationYear:
            extracted.education.graduationYear || prev.education.graduationYear,
        },
        jobTitlesSeeking: extracted.jobTitlesSeeking || prev.jobTitlesSeeking,
      }));
    } catch {
      setExtractError("Could not extract resume data. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const setField = <K extends keyof Profile>(field: K) => (value: Profile[K]) =>
    setProfile((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const formData = new FormData();
    formData.set("fullName", profile.fullName);
    formData.set("phone", profile.phone);
    formData.set("location", profile.location);
    formData.set("linkedinUrl", profile.linkedinUrl);
    formData.set("portfolioUrl", profile.portfolioUrl);
    formData.set("workAuthorization", profile.workAuthorization);
    formData.set("currentTitle", profile.currentTitle);
    formData.set("experienceLevel", profile.experienceLevel);
    formData.set("yearsExperience", profile.yearsExperience);
    formData.set("skills", JSON.stringify(profile.skills));
    formData.set("industries", JSON.stringify(profile.industries));
    formData.set("workExperience", JSON.stringify(profile.workExperience));
    formData.set("highestDegree", profile.education.highestDegree);
    formData.set("fieldOfStudy", profile.education.fieldOfStudy);
    formData.set("institutionName", profile.education.institutionName);
    formData.set("graduationYear", profile.education.graduationYear);
    formData.set("jobTitlesSeeking", profile.jobTitlesSeeking);
    formData.set("remotePreference", profile.remotePreference);
    formData.set("salaryExpectation", profile.salaryExpectation);
    formData.set("preferredLocations", profile.preferredLocations);
    if (resumeFile) {
      formData.set("resumeFile", resumeFile);
    }

    startTransition(async () => {
      const result = await saveProfile(formData);
      if (result.success) {
        setStatus({ type: "success", message: "Profile saved." });
        if (result.resumePdfUrl) {
          setProfile((prev) => ({ ...prev, resumePdfUrl: result.resumePdfUrl ?? prev.resumePdfUrl }));
        }
        setResumeFile(null);
        setResumeKey((k) => k + 1);
      } else {
        setStatus({ type: "error", message: result.error ?? "Failed to save profile." });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <ResumeUpload
        key={resumeKey}
        userId={profile.id}
        resumePdfUrl={profile.resumePdfUrl}
        onFileSelected={(file) => {
          setResumeFile(file);
          setExtractError(null);
        }}
        onExtractClick={handleExtract}
        isExtracting={isExtracting}
        extractError={extractError}
        onGenerateClick={handleGenerate}
        isGenerating={isGenerating}
        generateError={generateError}
      />

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <h2 className="text-lg font-bold text-text-primary">Profile Information</h2>
        <p className="mt-1 text-sm text-text-secondary">
          This context is used to accurately represent you in agent interactions.
        </p>

        <div className="mt-4 border-t border-border-light" />

        <section className="mt-6">
          <h3 className="text-base font-semibold text-text-primary">Personal Info</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name" value={profile.fullName} onChange={setField("fullName")} />
            <Field label="Email" value={profile.email} readOnly />
            <Field
              label="Phone Number"
              value={profile.phone}
              onChange={setField("phone")}
              placeholder="+1 (555) 000-0000"
            />
            <Field
              label="Location"
              value={profile.location}
              onChange={setField("location")}
              placeholder="City, Country"
            />
            <Field
              label="LinkedIn URL"
              value={profile.linkedinUrl}
              onChange={setField("linkedinUrl")}
            />
            <Field
              label="Portfolio / GitHub"
              value={profile.portfolioUrl}
              onChange={setField("portfolioUrl")}
            />
            <SelectField
              label="Work Authorization"
              value={profile.workAuthorization}
              onChange={setField("workAuthorization")}
              options={WORK_AUTHORIZATION_OPTIONS}
            />
          </div>
        </section>

        <div className="mt-6 border-t border-border-light" />

        <section className="mt-6">
          <h3 className="text-base font-semibold text-text-primary">Professional Info</h3>
          <div className="mt-4 flex flex-col gap-4">
            <Field
              label="Current/Recent Job Title"
              value={profile.currentTitle}
              onChange={setField("currentTitle")}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label="Experience Level"
                value={profile.experienceLevel}
                onChange={setField("experienceLevel")}
                options={EXPERIENCE_LEVEL_OPTIONS}
              />
              <Field
                label="Years of Experience"
                type="number"
                value={profile.yearsExperience}
                onChange={setField("yearsExperience")}
              />
            </div>
            <SkillsInput
              label="Skills"
              placeholder="Add a skill"
              tags={profile.skills}
              onChange={setField("skills")}
            />
            <SkillsInput
              label="Industries Worked In (Optional)"
              placeholder="E.g. FinTech, Healthcare"
              tags={profile.industries}
              onChange={setField("industries")}
            />
          </div>
        </section>

        <div className="mt-6 border-t border-border-light" />

        <section className="mt-6">
          <WorkExperienceSection
            roles={profile.workExperience}
            onChange={setField("workExperience")}
          />
        </section>

        <div className="mt-6 border-t border-border-light" />

        <section className="mt-6">
          <h3 className="text-base font-semibold text-text-primary">Education</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              label="Highest Degree"
              value={profile.education.highestDegree}
              onChange={(v) => setField("education")({ ...profile.education, highestDegree: v })}
              options={DEGREE_OPTIONS}
            />
            <Field
              label="Field of Study"
              value={profile.education.fieldOfStudy}
              onChange={(v) => setField("education")({ ...profile.education, fieldOfStudy: v })}
            />
            <Field
              label="Institution Name"
              value={profile.education.institutionName}
              onChange={(v) =>
                setField("education")({ ...profile.education, institutionName: v })
              }
              placeholder="E.g. State University"
            />
            <Field
              label="Graduation Year"
              value={profile.education.graduationYear}
              onChange={(v) =>
                setField("education")({ ...profile.education, graduationYear: v })
              }
              placeholder="YYYY"
            />
          </div>
        </section>

        <div className="mt-6 border-t border-border-light" />

        <section className="mt-6">
          <h3 className="text-base font-semibold text-text-primary">Job Preferences</h3>
          <div className="mt-4 flex flex-col gap-4">
            <Field
              label="Job Titles Seeking"
              value={profile.jobTitlesSeeking}
              onChange={setField("jobTitlesSeeking")}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label="Remote Preference"
                value={profile.remotePreference}
                onChange={setField("remotePreference")}
                options={REMOTE_PREFERENCE_OPTIONS}
              />
              <Field
                label="Salary Expectation (Optional)"
                value={profile.salaryExpectation}
                onChange={setField("salaryExpectation")}
                placeholder="E.g. $120k+"
              />
            </div>
            <Field
              label="Preferred Locations (Optional)"
              value={profile.preferredLocations}
              onChange={setField("preferredLocations")}
              placeholder="E.g. New York, London"
            />
          </div>
        </section>

        <div className="mt-6 border-t border-border-light" />

        {status && (
          <p
            className={`mt-6 rounded-md px-3 py-2 text-sm ${
              status.type === "success"
                ? "bg-success-lightest text-success-foreground"
                : "bg-error/10 text-error"
            }`}
          >
            {status.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-6 w-full rounded-md bg-accent py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </form>
  );
}
