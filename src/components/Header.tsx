"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/app/admin/logout/actions";
import { ThemeToggle } from "@/components/ThemeToggle";

type HeaderProps = {
  canCreateEvent?: boolean;
  canModifySettings?: boolean;
  showUsers?: boolean;
  isLoggedIn?: boolean;
};

export function Header({ canCreateEvent, canModifySettings, showUsers, isLoggedIn }: HeaderProps) {
  const pathname = usePathname();
  const isGuestView = pathname?.startsWith("/e/");

  const showNav = !isGuestView && (canCreateEvent || canModifySettings || showUsers);

  return (
    <header className="px-6 py-6">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link href="/" className="font-medium tracking-tight">
          Rondivu
        </Link>
        <div className="flex items-center gap-3">
        {showNav && (
          <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            {canCreateEvent && (
              <Link className="hover:text-zinc-950 dark:hover:text-zinc-50" href="/create-event">
                Create event
              </Link>
            )}
            {canModifySettings && (
              <Link className="hover:text-zinc-950 dark:hover:text-zinc-50" href="/settings">
                Settings
              </Link>
            )}
            {showUsers && (
              <Link className="hover:text-zinc-950 dark:hover:text-zinc-50" href="/users">
                Users
              </Link>
            )}
          </nav>
        )}
        {!isGuestView && (
          isLoggedIn ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Log out
              </button>
            </form>
          ) : (
            <Link
              href="/admin/login"
              className="text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Log in
            </Link>
          )
        )}
        <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
