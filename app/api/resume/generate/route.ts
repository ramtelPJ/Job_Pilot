import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { createInsforgeServer } from "@/lib/insforge-server";
import { getClaudeClient } from "@/lib/claude";
import { ResumePDF, type ResumeWorkExperience } from "@/components/resume/ResumePDF";
import type { EducationInfo, WorkExperienceEntry } from "@/types";

const GeneratedResumeSchema = z.object({
  professionalSummary: z.string(),
  workExperience: z.array(
    z.object({
      companyName: z.string(),
      jobTitle: z.string(),
      dateRange: z.string(),
      bullets: z.array(z.string()),
    }),
  ),
});

const SYSTEM_PROMPT =
  "You are a professional resume writer. Write a concise professional summary " +
  "(2 to 3 sentences) and turn each role's freeform notes into 2 to 4 polished, " +
  "achievement oriented bullet points. Ground everything in the facts given - " +
  "never invent employers, titles, dates, or accomplishments not stated. " +
  "dateRange should read like 'Jan 2022 - Present' or 'Jun 2019 - Feb 2022', " +
  "derived from the given start/end dates.";

function formatMonth(value: string): string {
  if (!value) return "";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export async function POST() {
  try {
    const insforge = await createInsforgeServer();
    const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: "You must be signed in." },
        { status: 401 },
      );
    }

    const userId = authData.user.id;

    const { data: row } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!row || !row.full_name || !row.current_title) {
      return NextResponse.json(
        {
          success: false,
          error: "Add your name and current title to your profile, then save before generating a resume.",
        },
        { status: 422 },
      );
    }

    const workExperience: WorkExperienceEntry[] = row.work_experience ?? [];
    const education: EducationInfo = row.education ?? {
      highestDegree: "",
      fieldOfStudy: "",
      institutionName: "",
      graduationYear: "",
    };
    const skills: string[] = row.skills ?? [];

    const claude = getClaudeClient();
    const response = await claude.messages.parse({
      model: "claude-opus-5",
      max_tokens: 4096,
      output_config: {
        format: zodOutputFormat(GeneratedResumeSchema),
        effort: "medium",
      },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            fullName: row.full_name,
            currentTitle: row.current_title,
            experienceLevel: row.experience_level,
            yearsExperience: row.years_experience,
            skills,
            workExperience: workExperience.map((role) => ({
              companyName: role.companyName,
              jobTitle: role.jobTitle,
              startDate: formatMonth(role.startDate),
              endDate: role.current ? "Present" : formatMonth(role.endDate),
              notes: role.responsibilities,
            })),
          }),
        },
      ],
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        { success: false, error: "Could not generate resume content." },
        { status: 422 },
      );
    }

    const generatedRoles: ResumeWorkExperience[] = response.parsed_output.workExperience;

    const buffer = await renderToBuffer(
      ResumePDF({
        fullName: row.full_name,
        currentTitle: row.current_title,
        email: row.email ?? authData.user.email ?? "",
        phone: row.phone ?? "",
        location: row.location ?? "",
        linkedinUrl: row.linkedin_url ?? "",
        portfolioUrl: row.portfolio_url ?? "",
        summary: response.parsed_output.professionalSummary,
        workExperience: generatedRoles,
        skills,
        education,
      }),
    );

    const blob = new Blob([new Uint8Array(buffer)], { type: "application/pdf" });
    const { data: uploadData, error: uploadError } = await insforge.storage
      .from("resumes")
      .upload(`${userId}/resume.pdf`, blob);

    if (uploadError || !uploadData) {
      console.error("[api/resume/generate]", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to save the generated resume." },
        { status: 500 },
      );
    }

    const { error: updateError } = await insforge.database
      .from("profiles")
      .update({ resume_pdf_url: uploadData.url })
      .eq("id", userId);

    if (updateError) {
      console.error("[api/resume/generate]", updateError);
      return NextResponse.json(
        { success: false, error: "Resume generated but could not be saved to your profile." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, resumePdfUrl: uploadData.url });
  } catch (error) {
    console.error("[api/resume/generate]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
