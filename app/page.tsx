import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/homepage/Hero";
import { DashboardPreview } from "@/components/homepage/DashboardPreview";
import { SectionDivider } from "@/components/homepage/SectionDivider";
import { JobSearchSection } from "@/components/homepage/JobSearchSection";
import { ConfidenceSection } from "@/components/homepage/ConfidenceSection";
import { Testimonial } from "@/components/homepage/Testimonial";
import { CTASection } from "@/components/homepage/CTASection";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />

      <main className="flex-1">
        <Hero />
        <DashboardPreview />
        <SectionDivider />
        <JobSearchSection />
        <SectionDivider />
        <ConfidenceSection />
        <Testimonial />
        <CTASection />
        <SectionDivider />
      </main>

      <Footer />
    </div>
  );
}
