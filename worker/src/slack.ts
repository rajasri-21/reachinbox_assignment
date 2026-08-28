import { prisma, decryptSlackWebhook } from "@reachinbox/db";

export async function sendSlackRateLimitNotification(
  ownerId: string,
  senderEmail: string,
): Promise<void> {
  let connection: { encryptedWebhookUrl: string; webhookIv: string; webhookAuthTag: string } | null = null;
  try {
    connection = await prisma.slackConnection.findUnique({
      where: { ownerId },
      select: {
        encryptedWebhookUrl: true,
        webhookIv: true,
        webhookAuthTag: true,
      },
    });
  } catch {
    return;
  }

  if (!connection) return;

  let webhookUrl: string;
  try {
    webhookUrl = decryptSlackWebhook({
      ciphertext: connection.encryptedWebhookUrl,
      iv: connection.webhookIv,
      authTag: connection.webhookAuthTag,
    });
  } catch {
    return;
  }

  if (!webhookUrl) return;

  const body = {
    text: `:warning: Hourly email limit reached for *${senderEmail}*. Further emails from this sender will be delayed to the next hour.`,
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Slack notification must never fail the email job. Swallow errors.
  }
}
