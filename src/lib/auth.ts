import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { getSetting, setSetting } from "@/lib/settings";

const COOKIE_NAME = "rondivu_admin";
const MAX_AGE = 60 * 60 * 24; // 24 hours
const HASH_KEY = "admin_password_hash";
const SESSION_SECRET_KEY = "admin_session_secret";

export type SessionUser = {
  userId: string;
  email: string;
  role: "ADMIN" | "USER";
  canCreateEvent: boolean;
  canModifySettings: boolean;
};

async function getSessionSecret(): Promise<Uint8Array | null> {
  const secret = await getSetting(SESSION_SECRET_KEY);
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

// --- Legacy (AppSetting) auth (for migration) ---
export async function isAdminPasswordConfigured(): Promise<boolean> {
  const hash = await getSetting(HASH_KEY);
  return !!hash?.trim();
}

export async function setAdminPassword(password: string): Promise<void> {
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash(password, 12);
  await setSetting(HASH_KEY, hash);

  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const secret = Buffer.from(bytes).toString("base64url");
  await setSetting(SESSION_SECRET_KEY, secret);
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const hash = await getSetting(HASH_KEY);
  if (!hash) return false;
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, hash);
}

// --- User model auth ---
export async function hasAnyUser(): Promise<boolean> {
  const count = await prisma.user.count();
  return count > 0;
}

export async function needsMigration(): Promise<boolean> {
  const hasHash = await isAdminPasswordConfigured();
  const hasUsers = await hasAnyUser();
  return hasHash && !hasUsers;
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
}

export async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) return false;
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, user.passwordHash);
}

export function sessionFromUser(user: {
  id: string;
  email: string;
  role: string;
  canCreateEvent: boolean;
  canModifySettings: boolean;
}): SessionUser {
  return {
    userId: user.id,
    email: user.email,
    role: user.role as "ADMIN" | "USER",
    canCreateEvent: user.role === "ADMIN" ? true : user.canCreateEvent,
    canModifySettings: user.role === "ADMIN" ? true : user.canModifySettings,
  };
}

export function canCreateEvent(session: SessionUser): boolean {
  return session.role === "ADMIN" || session.canCreateEvent;
}

export function canModifySettings(session: SessionUser): boolean {
  return session.role === "ADMIN" || session.canModifySettings;
}

export function isAdmin(session: SessionUser): boolean {
  return session.role === "ADMIN";
}

// --- Session (JWT) ---
export async function createUserSession(session: SessionUser): Promise<string> {
  const secret = await getSessionSecret();
  if (!secret) {
    // Ensure we have a session secret (for new installs)
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const s = Buffer.from(bytes).toString("base64url");
    await setSetting(SESSION_SECRET_KEY, s);
    return createUserSession(session);
  }
  const token = await new SignJWT({
    userId: session.userId,
    email: session.email,
    role: session.role,
    canCreateEvent: session.canCreateEvent,
    canModifySettings: session.canModifySettings,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret);
  return token;
}

/** Legacy: creates session with no user identity (for pre-migration) */
export async function createAdminSession(): Promise<string> {
  const secret = await getSessionSecret();
  if (!secret) throw new Error("Admin not configured");
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret);
  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const secret = await getSessionSecret();
  if (!secret) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string | undefined;
    const email = payload.email as string | undefined;
    const role = payload.role as string | undefined;
    const canCreateEvent = payload.canCreateEvent as boolean | undefined;
    const canModifySettings = payload.canModifySettings as boolean | undefined;

    if (!userId || !email) return null; // Legacy token without user identity
    if (role !== "ADMIN" && role !== "USER") return null;

    return {
      userId,
      email,
      role: role as "ADMIN" | "USER",
      canCreateEvent: role === "ADMIN" ? true : !!canCreateEvent,
      canModifySettings: role === "ADMIN" ? true : !!canModifySettings,
    };
  } catch {
    return null;
  }
}

/** Returns true if a valid session exists (legacy or user-based) */
export async function verifyAdminSession(): Promise<boolean> {
  const session = await getSession();
  if (session) return true;

  // Legacy: token with no payload still valid
  const secret = await getSessionSecret();
  if (!secret) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function setAdminSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Require a logged-in session. Redirects to login if not. */
export async function requireSession(returnTo?: string): Promise<SessionUser> {
  const session = await getSession();
  if (session) return session;

  const legacy = await verifyAdminSession();
  if (legacy) {
    return {
      userId: "",
      email: "",
      role: "ADMIN",
      canCreateEvent: true,
      canModifySettings: true,
    } as SessionUser;
  }

  const { redirect } = await import("next/navigation");
  redirect(`/admin/login?returnTo=${encodeURIComponent(returnTo ?? "/")}`);
  throw new Error("Redirect"); // unreachable
}

/** Require session + permission. Redirects to login or shows forbidden. */
export async function requirePermission(
  permission: "createEvent" | "modifySettings",
  returnTo?: string
): Promise<SessionUser> {
  const session = await requireSession(returnTo);
  if (permission === "createEvent" && !canCreateEvent(session)) {
    const { redirect } = await import("next/navigation");
    redirect("/");
    throw new Error("Redirect");
  }
  if (permission === "modifySettings" && !canModifySettings(session)) {
    const { redirect } = await import("next/navigation");
    redirect("/");
    throw new Error("Redirect");
  }
  return session;
}
