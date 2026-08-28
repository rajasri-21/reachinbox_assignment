import type { NextFunction, Request, Response } from "express";
import { db } from "@reachinbox/db";
import { readSessionUserId } from "../session.js";
import { unauthorized } from "../lib/httpError.js";

/** Populates `req.user` from the session cookie, or rejects with 401. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const userId = readSessionUserId(req);
  if (!userId) {
    next(unauthorized());
    return;
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    next(unauthorized());
    return;
  }

  req.user = user;
  next();
}
