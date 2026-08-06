import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "timecard_admin";
const MAX_AGE_MS = 1000 * 60 * 60 * 12;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createAdminToken(): string {
  const expires = Date.now() + MAX_AGE_MS;
  const payload = `admin.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [scope, expiresStr, signature] = parts;
  const payload = `${scope}.${expiresStr}`;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  return scope === "admin";
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("ADMIN_PASSWORD environment variable is not set");
  }
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
