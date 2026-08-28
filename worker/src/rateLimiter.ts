import type { Redis } from "ioredis";

// Lua script: atomically INCR counter, set EXPIRE on first creation, return allow/deny.
// KEYS[1] = counter key
// ARGV[1] = effective limit
// ARGV[2] = ttl seconds
const RATE_LIMIT_LUA = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[2])
else
  local ttl = redis.call("TTL", KEYS[1])
  if ttl == -1 then
    redis.call("EXPIRE", KEYS[1], ARGV[2])
  end
end
if current <= tonumber(ARGV[1]) then
  return 1
else
  return 0
end
`;

function utcHourWindow(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  return `${y}-${m}-${d}-${h}`;
}

export function rateLimitKey(senderId: string, hourWindow?: string): string {
  return `ratelimit:${senderId}:${hourWindow ?? utcHourWindow()}`;
}

export function rateLimitNotifyKey(senderId: string, hourWindow?: string): string {
  return `ratelimit:notify:${senderId}:${hourWindow ?? utcHourWindow()}`;
}

export function msUntilNextUtcHour(from = Date.now()): number {
  const now = new Date(from);
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(now.getUTCHours() + 1);
  const delay = next.getTime() - now.getTime();
  return delay > 0 ? delay : 60 * 60 * 1000;
}

export function ttlUntilNextHourSeconds(from = Date.now()): number {
  return Math.ceil(msUntilNextUtcHour(from) / 1000) + 60;
}

/**
 * Atomically check and increment the per-sender UTC hour counter.
 * @returns true if allowed, false if rate limit exceeded.
 */
export async function checkRateLimit(
  redis: Redis,
  senderId: string,
  effectiveLimit: number,
): Promise<boolean> {
  const key = rateLimitKey(senderId);
  const ttl = ttlUntilNextHourSeconds();
  const result = (await redis.eval(RATE_LIMIT_LUA, 1, key, String(effectiveLimit), String(ttl))) as number;
  return result === 1;
}

/**
 * Atomically set a marker so only one Slack notification is sent per sender/hour.
 * Returns true if this caller acquired the marker and should send notification.
 */
export async function tryAcquireNotifyMarker(redis: Redis, senderId: string): Promise<boolean> {
  const key = rateLimitNotifyKey(senderId);
  const ttl = ttlUntilNextHourSeconds();
  // SET key 1 NX EX ttl  -> returns "OK" if set, null otherwise
  const result = await redis.set(key, "1", "EX", ttl, "NX");
  return result === "OK";
}
