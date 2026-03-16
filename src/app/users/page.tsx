import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { InviteUserForm } from "./InviteUserForm";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requirePermission("modifySettings", "/users");

  const [users, pendingInvites] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        role: true,
        canCreateEvent: true,
        canModifySettings: true,
        createdAt: true,
      },
    }),
    prisma.userInvite.findMany({
      where: { usedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        canCreateEvent: true,
        canModifySettings: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Manage users and their permissions. Invite new users by email.
        </p>

        <InviteUserForm className="mt-10" />

        <section className="mt-10">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Active users</h2>
          <ul className="mt-3 space-y-2">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-white/5"
              >
                <span className="font-medium text-zinc-950 dark:text-zinc-50">{u.email}</span>
                <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {u.role === "ADMIN" ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                      Admin
                    </span>
                  ) : (
                    <>
                      {u.canCreateEvent && (
                        <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-white/10">
                          Create event
                        </span>
                      )}
                      {u.canModifySettings && (
                        <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-white/10">
                          Modify settings
                        </span>
                      )}
                      {!u.canCreateEvent && !u.canModifySettings && (
                        <span className="text-zinc-500">No permissions</span>
                      )}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {pendingInvites.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Pending invites</h2>
            <ul className="mt-3 space-y-2">
              {pendingInvites.map((inv) => {
                const expired = new Date() > inv.expiresAt;
                return (
                  <li
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <span className="font-medium text-zinc-950 dark:text-zinc-50">{inv.email}</span>
                    <span className="flex items-center gap-2 text-sm">
                      {expired ? (
                        <span className="text-red-600 dark:text-red-400">Expired</span>
                      ) : (
                        <>
                          {inv.canCreateEvent && (
                            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-white/10">
                              Create event
                            </span>
                          )}
                          {inv.canModifySettings && (
                            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-white/10">
                              Modify settings
                            </span>
                          )}
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
