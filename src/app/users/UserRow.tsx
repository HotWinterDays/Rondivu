"use client";

import { useState, useTransition } from "react";
import { deleteUserAction, updateUserAction } from "./actions";

type User = {
  id: string;
  email: string;
  role: string;
  canCreateEvent: boolean;
  canModifySettings: boolean;
};

type Props = {
  user: User;
  currentUserId: string | null;
};

export function UserRow({ user, currentUserId }: Props) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState(user.role);
  const [canCreateEvent, setCanCreateEvent] = useState(user.canCreateEvent);
  const [canModifySettings, setCanModifySettings] = useState(user.canModifySettings);

  const isAdmin = user.role === "ADMIN";
  const isCurrentUser = currentUserId === user.id;

  const handleSave = () => {
    setError(null);
    const formData = new FormData();
    formData.set("userId", user.id);
    formData.set("role", role);
    formData.set("canCreateEvent", canCreateEvent ? "on" : "");
    formData.set("canModifySettings", canModifySettings ? "on" : "");
    startTransition(async () => {
      const res = await updateUserAction(formData);
      if (res.ok) {
        setEditing(false);
        window.location.reload();
      } else {
        setError(res.error ?? "Could not update user.");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    setError(null);
    const formData = new FormData();
    formData.set("userId", user.id);
    startTransition(async () => {
      const res = await deleteUserAction(formData);
      if (res.ok) {
        window.location.reload();
      } else {
        setError(res.error ?? "Could not delete user.");
      }
    });
  };

  return (
    <li className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-zinc-950 dark:text-zinc-50">{user.email}</span>
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                {isAdmin ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                    Admin
                  </span>
                ) : (
                  <>
                    {user.canCreateEvent && (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-white/10">
                        Create event
                      </span>
                    )}
                    {user.canModifySettings && (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-white/10">
                        Modify settings
                      </span>
                    )}
                    {!user.canCreateEvent && !user.canModifySettings && (
                      <span className="text-zinc-500">No permissions</span>
                    )}
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isCurrentUser || pending}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-40 dark:text-red-400 dark:hover:text-red-300"
              >
                Delete
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setRole(user.role);
                setCanCreateEvent(user.canCreateEvent);
                setCanModifySettings(user.canModifySettings);
                setError(null);
              }}
              className="text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4 dark:border-white/10">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-100">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {role === "USER" && (
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={canCreateEvent}
                  onChange={(e) => setCanCreateEvent(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                Create event
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={canModifySettings}
                  onChange={(e) => setCanModifySettings(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                Modify settings
              </label>
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="inline-flex h-9 items-center justify-center rounded-full bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {pending ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </li>
  );
}
