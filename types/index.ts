export type WorkExperienceEntry = {
  companyName: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  current: boolean;
  responsibilities: string;
};

export type EducationInfo = {
  highestDegree: string;
  fieldOfStudy: string;
  institutionName: string;
  graduationYear: string;
};

export type Profile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  experienceLevel: string;
  yearsExperience: string;
  skills: string[];
  industries: string[];
  workExperience: WorkExperienceEntry[];
  education: EducationInfo;
  jobTitlesSeeking: string;
  remotePreference: string;
  preferredLocations: string;
  salaryExpectation: string;
  coverLetterTone: string;
  linkedinUrl: string;
  portfolioUrl: string;
  workAuthorization: string;
  resumePdfUrl: string | null;
  isComplete: boolean;
};

export type CompanyResearch = {
  companyOverview: string;
  techStack: string[];
  culture: string[];
  whyThisRole: string;
  yourEdge: string[];
  gapsToAddress: string[];
  smartQuestions: string[];
  interviewPrep: string[];
  sources: string[];
};

export type Job = {
  id: string;
  runId: string;
  userId: string;
  source: "search";
  sourceUrl: string | null;
  externalApplyUrl: string | null;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  jobType: string | null;
  aboutRole: string | null;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  aboutCompany: string | null;
  matchScore: number | null;
  matchReason: string | null;
  matchedSkills: string[];
  missingSkills: string[];
  companyResearch: CompanyResearch | null;
  foundAt: string;
  researchedAt: string | null;
};

export type AgentRunStatus = "running" | "completed" | "failed";

export type AgentRun = {
  id: string;
  userId: string;
  status: AgentRunStatus;
  jobTitleSearched: string;
  locationSearched: string | null;
  jobsFound: number;
  startedAt: string;
  completedAt: string | null;
};
