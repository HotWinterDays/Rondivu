import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50`}
      >
        <div className="min-h-dvh">
          <header className="px-6 py-6">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
              <a href="/" className="font-medium tracking-tight">
                Rondivu
              </a>
              <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                <a className="hover:text-zinc-950 dark:hover:text-zinc-50" href="/create-event">
                  Create event
                </a>
                <a className="hover:text-zinc-950 dark:hover:text-zinc-50" href="/settings">
                  Settings
                </a>
              </nav>
            </div>
          </header>
          <main className="px-6 pb-16">{children}</main>
        </div>
      </body>
    </html>
  );
}
