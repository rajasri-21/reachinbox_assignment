import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./env.js";
import { authRouter } from "./routes/auth.js";
import { slackRouter } from "./routes/slack.js";
import { emailsRouter } from "./routes/emails.js";
import { bullBoardRouter } from "./bullBoard.js";
import { requireAuth } from "./middleware/auth.js";
import { HttpError } from "./lib/httpError.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/integrations/slack", slackRouter);
  app.use("/api/emails", emailsRouter);
  app.use("/admin/queues", requireAuth, bullBoardRouter);

  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof SyntaxError && (err as unknown as { status?: number }).status === 400) {
      res.status(400).json({ error: "Invalid JSON" });
      return;
    }
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  };
  app.use(errorHandler);

  return app;
}
