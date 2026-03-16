import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { getSetting, setSetting } from "@/lib/settings";

const COOKIE_NAME = "rondivu_admin";
const MAX_AGE = 60 * 60 * 24; // 24 hours
const HASH_KEY = "admin_password_hash";
const SESSION_SECRET_KEY = "admin_session_secret";

async function getSessionSecret(): Promise<Uint8Array | null> {
  const secret = await getSetting(SESSION_SECRET_KEY);
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function isAdminPasswordConfigured(): Promise<boolean> {
  const hash = await getSetting(HASH_KEY);
  return !!hash?.trim();
}

export async function setAdminPassword(password: string): Promise<void> {
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash(password, 12);
  await setSetting(HASH_KEY, hash);

  // Generate a random session secret for JWT signing (not derived from password)
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

export async function verifyAdminSession(): Promise<boolean> {
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
