import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
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
  const isLoggedIn = !!session?.userId || !!legacySession;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50`}
      >
        <ThemeProvider>
        <div className="flex min-h-dvh flex-col">
          <Header
            canCreateEvent={canCreateEvent}
            canModifySettings={canModifySettings}
            showUsers={showUsers}
            isLoggedIn={isLoggedIn}
          />
          <main className="px-6 pb-16">{children}</main>
          <Footer />
        </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
