import type { Profile } from "@/types";

type CompletionSection = {
  label: string;
  isFilled: (profile: Profile) => boolean;
};

const COMPLETION_SECTIONS: CompletionSection[] = [
  { label: "Full Name", isFilled: (p) => p.fullName.trim().length > 0 },
  { label: "Phone", isFilled: (p) => p.phone.trim().length > 0 },
  { label: "Location", isFilled: (p) => p.location.trim().length > 0 },
  { label: "Work Authorization", isFilled: (p) => p.workAuthorization.trim().length > 0 },
  { label: "Job Title", isFilled: (p) => p.currentTitle.trim().length > 0 },
  {
    label: "Experience",
    isFilled: (p) =>
      p.experienceLevel.trim().length > 0 && p.yearsExperience.trim().length > 0,
  },
  { label: "Skills", isFilled: (p) => p.skills.length > 0 },
  {
    label: "Work Experience",
    isFilled: (p) =>
      p.workExperience.some(
        (role) => role.companyName.trim().length > 0 && role.jobTitle.trim().length > 0,
      ),
  },
  {
    label: "Education",
    isFilled: (p) =>
      p.education.highestDegree.trim().length > 0 &&
      p.education.institutionName.trim().length > 0 &&
      p.education.graduationYear.trim().length > 0,
  },
  { label: "Job Titles Seeking", isFilled: (p) => p.jobTitlesSeeking.trim().length > 0 },
  { label: "Remote Preference", isFilled: (p) => p.remotePreference.trim().length > 0 },
];

export function computeProfileCompletion(profile: Profile): {
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
} {
  const missingFields = COMPLETION_SECTIONS.filter((s) => !s.isFilled(profile)).map(
    (s) => s.label,
  );
  const percentage = Math.round(
    ((COMPLETION_SECTIONS.length - missingFields.length) / COMPLETION_SECTIONS.length) * 100,
  );

  return { percentage, missingFields, isComplete: missingFields.length === 0 };
}
