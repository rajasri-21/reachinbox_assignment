import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

import { decryptSlackWebhook, encryptSlackWebhook } from "./secrets.js";

test("Slack webhooks round-trip and reject invalid keys or tampering", () => {
  const key = randomBytes(32).toString("base64");
  const encrypted = encryptSlackWebhook("https://hooks.slack.test/secret", key);

  assert.equal(decryptSlackWebhook(encrypted, key), "https://hooks.slack.test/secret");
  assert.throws(() => encryptSlackWebhook("secret", "short"), /32-byte key/);
  assert.throws(() =>
    decryptSlackWebhook({ ...encrypted, ciphertext: Buffer.from("tampered").toString("base64") }, key),
  );
});
