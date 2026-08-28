import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { env } from "./env.js";

export const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Builds the signed session cookie value for `userId`, without touching a Response. */
export function signSessionCookieValue(userId: string): string {
  const payload = JSON.stringify({ uid: userId, iat: Date.now() });
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const signature = sign(encoded, env.SESSION_SECRET);
  return `${encoded}.${signature}`;
}

/** Sets the HttpOnly application-session cookie identifying `userId`. */
export function setSessionCookie(res: Response, userId: string): void {
  res.cookie(SESSION_COOKIE, signSessionCookieValue(userId), {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

/** Verifies the session cookie on `req` and returns the authenticated user id, or null. */
export function readSessionUserId(req: Request): string | null {
  const raw = req.cookies?.[SESSION_COOKIE];
  if (typeof raw !== "string") return null;

  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature) return null;
  if (!safeEqual(sign(encoded, env.SESSION_SECRET), signature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
      uid?: unknown;
      iat?: unknown;
    };
    if (typeof payload.uid !== "string" || typeof payload.iat !== "number") return null;
    if (Date.now() - payload.iat > SESSION_MAX_AGE_MS) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

/** Signs a short-lived, tamper-proof Slack OAuth `state` value bound to `userId`. */
export function createSlackState(userId: string): string {
  const payload = JSON.stringify({ uid: userId, iat: Date.now(), nonce: sign(`${Math.random()}`, env.SESSION_SECRET).slice(0, 8) });
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const signature = sign(encoded, env.SESSION_SECRET);
  return `${encoded}.${signature}`;
}

/** Verifies a Slack OAuth `state` value and returns the bound user id, or null if invalid/expired. */
export function verifySlackState(state: string): string | null {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) return null;
  if (!safeEqual(sign(encoded, env.SESSION_SECRET), signature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
      uid?: unknown;
      iat?: unknown;
    };
    if (typeof payload.uid !== "string" || typeof payload.iat !== "number") return null;
    if (Date.now() - payload.iat > STATE_MAX_AGE_MS) return null;
    return payload.uid;
  } catch {
    return null;
  }
}
