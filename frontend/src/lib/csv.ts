const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ParseLeadsResult = {
  valid: string[];
  invalid: string[];
};

function isEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_RE.test(value);
}

/**
 * Parse lead emails from raw file text.
 * - Supports comma and newline separated values
 * - Trims whitespace, ignores empty values
 * - Validates email format
 * - Deduplicates case-insensitively, preserving original casing of first occurrence
 */
export function parseLeads(text: string): ParseLeadsResult {
  // Split on commas and newlines (covers \r, \n, \r\n)
  const rawTokens = text.split(/[\r\n,]+/);

  const trimmed = rawTokens.map((t) => t.trim()).filter((t) => t.length > 0);

  const seenValid = new Map<string, string>();
  const seenInvalid = new Set<string>();
  const invalid: string[] = [];

  for (const token of trimmed) {
    const normalized = token.toLowerCase();
    if (isEmail(token)) {
      if (!seenValid.has(normalized)) {
        seenValid.set(normalized, token);
      }
    } else {
      if (!seenInvalid.has(normalized)) {
        seenInvalid.add(normalized);
        invalid.push(token);
      }
    }
  }

  return {
    valid: Array.from(seenValid.values()),
    invalid,
  };
}
