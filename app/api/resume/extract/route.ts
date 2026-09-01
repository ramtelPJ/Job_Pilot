import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { createInsforgeServer } from "@/lib/insforge-server";
import { getClaudeClient } from "@/lib/claude";

const ExtractedProfileSchema = z.object({
  fullName: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  portfolioUrl: z.string().nullable(),
  currentTitle: z.string().nullable(),
  experienceLevel: z.enum(["junior", "mid", "senior", "lead"]).nullable(),
  yearsExperience: z.number().nullable(),
  skills: z.array(z.string()),
  industries: z.array(z.string()),
  workExperience: z
    .array(
      z.object({
        companyName: z.string(),
        jobTitle: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        current: z.boolean(),
        responsibilities: z.string(),
      }),
    )
    .max(3),
  education: z.object({
    highestDegree: z
      .enum(["high_school", "associate", "bachelor", "master", "doctorate"])
      .nullable(),
    fieldOfStudy: z.string().nullable(),
    institutionName: z.string().nullable(),
    graduationYear: z.string().nullable(),
  }),
  jobTitlesSeeking: z.string().nullable(),
});

const SYSTEM_PROMPT =
  "You extract structured resume data for a job seeker's profile form. Only extract " +
  "information explicitly present in the resume text below - never guess or invent a " +
  "value. Leave a field null (or an empty array) when the resume doesn't state it. " +
  "Dates should be formatted as YYYY-MM when a month and year are both determinable, " +
  "otherwise leave the date empty. Include at most 3 of the most recent work experience " +
  "entries. Do not invent job preferences (remote preference, salary, locations) - " +
  "resumes don't state those.";

export async function POST(req: NextRequest) {
  try {
    const insforge = await createInsforgeServer();
    const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: "You must be signed in." },
        { status: 401 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("resumeFile");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No resume file provided." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const parser = new PDFParse({ data: buffer });
    let extractedText: string;
    try {
      const result = await parser.getText();
      extractedText = result.text.trim();
    } finally {
      await parser.destroy();
    }

    if (extractedText.length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not extract text from this PDF. Please try a different file.",
        },
        { status: 422 },
      );
    }

    const claude = getClaudeClient();
    const response = await claude.messages.parse({
      model: "claude-opus-5",
      max_tokens: 4096,
      output_config: {
        format: zodOutputFormat(ExtractedProfileSchema),
        effort: "low",
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: extractedText }],
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        { success: false, error: "Could not read the fields from this resume." },
        { status: 422 },
      );
    }

    return NextResponse.json({ success: true, data: response.parsed_output });
  } catch (error) {
    console.error("[api/resume/extract]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
