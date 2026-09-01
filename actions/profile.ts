"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";
import { computeProfileCompletion } from "@/lib/profile-completion";
import type { Profile, WorkExperienceEntry } from "@/types";

function parseStringArray(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function parseWorkExperience(value: FormDataEntryValue | null): WorkExperienceEntry[] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function commaListToArray(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function saveProfile(formData: FormData) {
  try {
    const insforge = await createInsforgeServer();
    const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

    if (authError || !authData.user) {
      return { success: false, error: "You must be signed in to save your profile." };
    }

    const userId = authData.user.id;

    const profileDraft: Profile = {
      id: userId,
      fullName: String(formData.get("fullName") ?? ""),
      email: authData.user.email ?? "",
      phone: String(formData.get("phone") ?? ""),
      location: String(formData.get("location") ?? ""),
      currentTitle: String(formData.get("currentTitle") ?? ""),
      experienceLevel: String(formData.get("experienceLevel") ?? ""),
      yearsExperience: String(formData.get("yearsExperience") ?? ""),
      skills: parseStringArray(formData.get("skills")),
      industries: parseStringArray(formData.get("industries")),
      workExperience: parseWorkExperience(formData.get("workExperience")),
      education: {
        highestDegree: String(formData.get("highestDegree") ?? ""),
        fieldOfStudy: String(formData.get("fieldOfStudy") ?? ""),
        institutionName: String(formData.get("institutionName") ?? ""),
        graduationYear: String(formData.get("graduationYear") ?? ""),
      },
      jobTitlesSeeking: String(formData.get("jobTitlesSeeking") ?? ""),
      remotePreference: String(formData.get("remotePreference") ?? ""),
      preferredLocations: String(formData.get("preferredLocations") ?? ""),
      salaryExpectation: String(formData.get("salaryExpectation") ?? ""),
      coverLetterTone: "",
      linkedinUrl: String(formData.get("linkedinUrl") ?? ""),
      portfolioUrl: String(formData.get("portfolioUrl") ?? ""),
      workAuthorization: String(formData.get("workAuthorization") ?? ""),
      resumePdfUrl: null,
      isComplete: false,
    };

    let resumePdfUrl: string | undefined;
    const resumeFile = formData.get("resumeFile");
    if (resumeFile instanceof File && resumeFile.size > 0) {
      const { data: uploadData, error: uploadError } = await insforge.storage
        .from("resumes")
        .upload(`${userId}/resume.pdf`, resumeFile);

      if (uploadError) {
        console.error("[actions/profile]", uploadError);
        return { success: false, error: "Failed to upload resume." };
      }
      resumePdfUrl = uploadData?.url;
    }

    const { isComplete } = computeProfileCompletion(profileDraft);

    const { error: dbError } = await insforge.database
      .from("profiles")
      .upsert({
        id: userId,
        full_name: profileDraft.fullName,
        email: profileDraft.email,
        phone: profileDraft.phone,
        location: profileDraft.location,
        current_title: profileDraft.currentTitle,
        experience_level: profileDraft.experienceLevel,
        years_experience: profileDraft.yearsExperience
          ? Number(profileDraft.yearsExperience)
          : null,
        skills: profileDraft.skills,
        industries: profileDraft.industries,
        work_experience: profileDraft.workExperience,
        education: profileDraft.education,
        job_titles_seeking: commaListToArray(profileDraft.jobTitlesSeeking),
        remote_preference: profileDraft.remotePreference,
        preferred_locations: commaListToArray(profileDraft.preferredLocations),
        salary_expectation: profileDraft.salaryExpectation,
        linkedin_url: profileDraft.linkedinUrl,
        portfolio_url: profileDraft.portfolioUrl,
        work_authorization: profileDraft.workAuthorization,
        ...(resumePdfUrl ? { resume_pdf_url: resumePdfUrl } : {}),
        is_complete: isComplete,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (dbError) {
      console.error("[actions/profile]", dbError);
      return { success: false, error: "Failed to save profile." };
    }

    revalidatePath("/profile");
    return { success: true, resumePdfUrl };
  } catch (error) {
    console.error("[actions/profile]", error);
    return { success: false, error: "Failed to save profile." };
  }
}
