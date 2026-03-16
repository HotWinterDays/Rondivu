import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { getSession, verifyAdminSession } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rondivu",
  description: "Self-hosted, minimalist invite and RSVP kit.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const legacySession = !session && (await verifyAdminSession());
  const canCreateEvent = legacySession || (session ? (session.role === "ADMIN" || session.canCreateEvent) : false);
  const canModifySettings = legacySession || (session ? (session.role === "ADMIN" || session.canModifySettings) : false);
  const showUsers = canModifySettings;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50`}
      >
        <div className="min-h-dvh">
          <Header
            canCreateEvent={canCreateEvent}
            canModifySettings={canModifySettings}
            showUsers={showUsers}
          />
          <main className="px-6 pb-16">{children}</main>
        </div>
      </body>
    </html>
  );
}
