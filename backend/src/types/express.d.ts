import type { User } from "@reachinbox/db";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
