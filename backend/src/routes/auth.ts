import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { db } from "@reachinbox/db";
import { env } from "../env.js";
import { setSessionCookie, clearSessionCookie } from "../session.js";
import { requireAuth } from "../middleware/auth.js";
import { badRequest, unauthorized } from "../lib/httpError.js";

export const authRouter = Router();

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

function serializeUser(user: { id: string; email: string; name: string; avatarUrl: string | null }) {
  return { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl };
}

authRouter.post("/google", async (req, res, next) => {
  try {
    const credential = (req.body as Record<string, unknown> | undefined)?.credential;
    if (typeof credential !== "string" || credential.length === 0) {
      throw badRequest("credential is required");
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw unauthorized("Invalid Google credential");
    }

    if (!payload?.sub || !payload.email) {
      throw unauthorized("Invalid Google credential");
    }

    const user = await db.user.upsert({
      where: { googleSub: payload.sub },
      create: {
        googleSub: payload.sub,
        email: payload.email,
        name: payload.name ?? payload.email,
        avatarUrl: payload.picture ?? null,
      },
      update: {
        email: payload.email,
        name: payload.name ?? payload.email,
        avatarUrl: payload.picture ?? null,
      },
    });

    setSessionCookie(res, user.id);
    res.json({ user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: serializeUser(req.user!) });
});

authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});
