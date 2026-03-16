import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { AcceptInviteForm } from "./AcceptInviteForm";

export const dynamic = "force-dynamic";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.userInvite.findUnique({
    where: { token, usedAt: null },
    select: { id: true, email: true, expiresAt: true },
  });

  if (!invite) notFound();
  if (new Date() > invite.expiresAt) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-2xl font-semibold tracking-tight">Invite expired</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            This invite has expired. Ask for a new one.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 px-6 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">Accept invite</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Set a password for {invite.email} to activate your account.
        </p>
        <AcceptInviteForm token={token} />
      </div>
    </div>
  );
}
