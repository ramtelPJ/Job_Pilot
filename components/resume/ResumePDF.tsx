import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import type { EducationInfo } from "@/types";

const DEGREE_LABELS: Record<string, string> = {
  high_school: "High School",
  associate: "Associate Degree",
  bachelor: "Bachelor's Degree",
  master: "Master's Degree",
  doctorate: "Doctorate",
};

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: "Helvetica" },
  name: { fontSize: 22, fontWeight: "bold", color: "#101828" },
  title: { fontSize: 12, color: "#364153", marginTop: 2 },
  contactLine: { fontSize: 9, color: "#6a7282", marginTop: 6 },
  section: { marginTop: 16 },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#101828",
    marginBottom: 6,
  },
  paragraph: { fontSize: 10, color: "#364153", lineHeight: 1.5 },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  roleTitle: { fontSize: 10.5, fontWeight: "bold", color: "#101828" },
  roleDates: { fontSize: 9, color: "#6a7282" },
  roleBlock: { marginBottom: 10 },
  bullet: { fontSize: 10, color: "#364153", lineHeight: 1.5, marginTop: 3 },
  skillsText: { fontSize: 10, color: "#364153", lineHeight: 1.5 },
});

export type ResumeWorkExperience = {
  companyName: string;
  jobTitle: string;
  dateRange: string;
  bullets: string[];
};

type Props = {
  fullName: string;
  currentTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
  summary: string;
  workExperience: ResumeWorkExperience[];
  skills: string[];
  education: EducationInfo;
};

export function ResumePDF({
  fullName,
  currentTitle,
  email,
  phone,
  location,
  linkedinUrl,
  portfolioUrl,
  summary,
  workExperience,
  skills,
  education,
}: Props) {
  const contactParts = [email, phone, location, linkedinUrl, portfolioUrl].filter(Boolean);
  const degreeLabel = education.highestDegree ? DEGREE_LABELS[education.highestDegree] : "";
  const educationLine = [degreeLabel, education.fieldOfStudy].filter(Boolean).join(", ");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{fullName}</Text>
        {currentTitle && <Text style={styles.title}>{currentTitle}</Text>}
        {contactParts.length > 0 && (
          <Text style={styles.contactLine}>{contactParts.join("  •  ")}</Text>
        )}

        {summary && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Professional Summary</Text>
            <Text style={styles.paragraph}>{summary}</Text>
          </View>
        )}

        {workExperience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Work Experience</Text>
            {workExperience.map((role, index) => (
              <View key={index} style={styles.roleBlock}>
                <View style={styles.roleRow}>
                  <Text style={styles.roleTitle}>
                    {role.jobTitle} — {role.companyName}
                  </Text>
                  <Text style={styles.roleDates}>{role.dateRange}</Text>
                </View>
                {role.bullets.map((bullet, bulletIndex) => (
                  <Text key={bulletIndex} style={styles.bullet}>
                    • {bullet}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Skills</Text>
            <Text style={styles.skillsText}>{skills.join("  •  ")}</Text>
          </View>
        )}

        {(educationLine || education.institutionName) && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Education</Text>
            {educationLine && <Text style={styles.paragraph}>{educationLine}</Text>}
            {(education.institutionName || education.graduationYear) && (
              <Text style={styles.contactLine}>
                {[education.institutionName, education.graduationYear]
                  .filter(Boolean)
                  .join("  •  ")}
              </Text>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}
