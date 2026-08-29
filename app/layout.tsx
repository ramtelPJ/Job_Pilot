import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { IdentifyUser } from "@/components/analytics/IdentifyUser";
import { createInsforgeServer } from "@/lib/insforge-server";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobPilot",
  description: "AI-powered job hunting assistant",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <IdentifyUser
          userId={data.user?.id ?? null}
          email={data.user?.email ?? null}
        />
        {children}
      </body>
    </html>
  );
}
