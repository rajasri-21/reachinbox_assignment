import { Router } from "express";
import { db, encryptSlackWebhook } from "@reachinbox/db";
import { env } from "../env.js";
import { requireAuth } from "../middleware/auth.js";
import { createSlackState, verifySlackState } from "../session.js";
import { badRequest } from "../lib/httpError.js";

export const slackRouter = Router();

type SlackOAuthResponse = {
  ok: boolean;
  error?: string;
  team?: { id: string; name?: string };
  incoming_webhook?: {
    url: string;
    channel?: string;
    channel_id?: string;
  };
};

slackRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const connection = await db.slackConnection.findUnique({
      where: { ownerId: req.user!.id },
    });
    res.json({
      connected: Boolean(connection),
      teamName: connection?.teamName ?? null,
      channelName: connection?.channelName ?? null,
    });
  } catch (err) {
    next(err);
  }
});

slackRouter.get("/connect", requireAuth, (req, res) => {
  const state = createSlackState(req.user!.id);
  const authorizeUrl = new URL("https://slack.com/oauth/v2/authorize");
  authorizeUrl.searchParams.set("client_id", env.SLACK_CLIENT_ID);
  authorizeUrl.searchParams.set("scope", "incoming-webhook");
  authorizeUrl.searchParams.set("redirect_uri", env.SLACK_REDIRECT_URI);
  authorizeUrl.searchParams.set("state", state);
  res.redirect(authorizeUrl.toString());
});

slackRouter.get("/callback", async (req, res, _next) => {
  try {
    const { code, state, error } = req.query;
    if (typeof error === "string") {
      res.redirect(`${env.FRONTEND_URL}/?slack=error`);
      return;
    }
    if (typeof state !== "string") {
      throw badRequest("Missing state");
    }
    const userId = verifySlackState(state);
    if (!userId) {
      res.redirect(`${env.FRONTEND_URL}/?slack=error`);
      return;
    }
    if (typeof code !== "string") {
      res.redirect(`${env.FRONTEND_URL}/?slack=error`);
      return;
    }

    const body = new URLSearchParams({
      client_id: env.SLACK_CLIENT_ID,
      client_secret: env.SLACK_CLIENT_SECRET,
      code,
      redirect_uri: env.SLACK_REDIRECT_URI,
    });
    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      body,
    });
    const payload = (await tokenResponse.json()) as SlackOAuthResponse;

    if (!tokenResponse.ok || !payload.ok || !payload.incoming_webhook?.url) {
      res.redirect(`${env.FRONTEND_URL}/?slack=error`);
      return;
    }

    const encrypted = encryptSlackWebhook(payload.incoming_webhook.url);

    await db.slackConnection.upsert({
      where: { ownerId: userId },
      create: {
        ownerId: userId,
        encryptedWebhookUrl: encrypted.ciphertext,
        webhookIv: encrypted.iv,
        webhookAuthTag: encrypted.authTag,
        teamId: payload.team?.id ?? "",
        teamName: payload.team?.name ?? null,
        channelId: payload.incoming_webhook.channel_id ?? "",
        channelName: payload.incoming_webhook.channel ?? null,
      },
      update: {
        encryptedWebhookUrl: encrypted.ciphertext,
        webhookIv: encrypted.iv,
        webhookAuthTag: encrypted.authTag,
        teamId: payload.team?.id ?? "",
        teamName: payload.team?.name ?? null,
        channelId: payload.incoming_webhook.channel_id ?? "",
        channelName: payload.incoming_webhook.channel ?? null,
      },
    });

    res.redirect(`${env.FRONTEND_URL}/?slack=connected`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.redirect(`${env.FRONTEND_URL}/?slack=error`);
  }
});

slackRouter.delete("/", requireAuth, async (req, res, next) => {
  try {
    await db.slackConnection.deleteMany({ where: { ownerId: req.user!.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
