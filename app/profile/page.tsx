import { redirect } from "next/navigation";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CompletionIndicator } from "@/components/profile/CompletionIndicator";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { createInsforgeServer } from "@/lib/insforge-server";
import { computeProfileCompletion } from "@/lib/profile-completion";
import { emptyProfile, mapRowToProfile, type ProfileRow } from "@/lib/profile";

export default async function ProfilePage() {
  const insforge = await createInsforgeServer();
  const { data: authData } = await insforge.auth.getCurrentUser();

  if (!authData.user) {
    redirect("/login");
  }

  const { data: row } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .maybeSingle();

  const profile = row
    ? mapRowToProfile(row as ProfileRow, authData.user.email ?? "")
    : emptyProfile(authData.user.id, authData.user.email ?? "");

  const { percentage, missingFields } = computeProfileCompletion(profile);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar authenticated />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="flex flex-col gap-6">
          <CompletionIndicator percentage={percentage} missingFields={missingFields} />
          <ProfileForm initialProfile={profile} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
