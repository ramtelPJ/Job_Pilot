import type { Profile } from "@/types";

export function emptyProfile(id: string, email: string): Profile {
  return {
    id,
    fullName: "",
    email,
    phone: "",
    location: "",
    currentTitle: "",
    experienceLevel: "",
    yearsExperience: "",
    skills: [],
    industries: [],
    workExperience: [],
    education: {
      highestDegree: "",
      fieldOfStudy: "",
      institutionName: "",
      graduationYear: "",
    },
    jobTitlesSeeking: "",
    remotePreference: "",
    preferredLocations: "",
    salaryExpectation: "",
    coverLetterTone: "",
    linkedinUrl: "",
    portfolioUrl: "",
    workAuthorization: "",
    resumePdfUrl: null,
    isComplete: false,
  };
}

export type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  experience_level: string | null;
  years_experience: number | null;
  skills: string[] | null;
  industries: string[] | null;
  work_experience: Profile["workExperience"] | null;
  education: Partial<Profile["education"]> | null;
  job_titles_seeking: string[] | null;
  remote_preference: string | null;
  preferred_locations: string[] | null;
  salary_expectation: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  work_authorization: string | null;
  resume_pdf_url: string | null;
  is_complete: boolean | null;
};

export function mapRowToProfile(row: ProfileRow, fallbackEmail: string): Profile {
  return {
    id: row.id,
    fullName: row.full_name ?? "",
    email: row.email ?? fallbackEmail,
    phone: row.phone ?? "",
    location: row.location ?? "",
    currentTitle: row.current_title ?? "",
    experienceLevel: row.experience_level ?? "",
    yearsExperience: row.years_experience != null ? String(row.years_experience) : "",
    skills: row.skills ?? [],
    industries: row.industries ?? [],
    workExperience: row.work_experience ?? [],
    education: {
      highestDegree: row.education?.highestDegree ?? "",
      fieldOfStudy: row.education?.fieldOfStudy ?? "",
      institutionName: row.education?.institutionName ?? "",
      graduationYear: row.education?.graduationYear ?? "",
    },
    jobTitlesSeeking: (row.job_titles_seeking ?? []).join(", "),
    remotePreference: row.remote_preference ?? "",
    preferredLocations: (row.preferred_locations ?? []).join(", "),
    salaryExpectation: row.salary_expectation ?? "",
    coverLetterTone: "",
    linkedinUrl: row.linkedin_url ?? "",
    portfolioUrl: row.portfolio_url ?? "",
    workAuthorization: row.work_authorization ?? "",
    resumePdfUrl: row.resume_pdf_url,
    isComplete: row.is_complete ?? false,
  };
}
