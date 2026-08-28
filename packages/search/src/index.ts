import { Client, type estypes } from "@elastic/elasticsearch";
import type { EmailStatus } from "@reachinbox/contracts";

export const EMAIL_INDEX = "emails";

export type EmailSearchDocument = {
  id: string;
  ownerId: string;
  recipient: string;
  senderEmail: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt: string | null;
  status: EmailStatus;
  failureReason: string | null;
  previewUrl: string | null;
};

export type SearchEmailsOptions = {
  q?: string;
  status?: EmailStatus;
  page?: number;
  limit?: number;
};

export type SearchEmailsResult = {
  items: EmailSearchDocument[];
  total: number;
  page: number;
  limit: number;
};

export const EMAIL_INDEX_MAPPINGS: estypes.MappingTypeMapping = {
  dynamic: "strict",
  properties: {
    id: { type: "keyword" },
    ownerId: { type: "keyword" },
    recipient: { type: "text", fields: { keyword: { type: "keyword" } } },
    senderEmail: { type: "text", fields: { keyword: { type: "keyword" } } },
    subject: { type: "text" },
    body: { type: "text" },
    scheduledAt: { type: "date" },
    sentAt: { type: "date" },
    status: { type: "keyword" },
    failureReason: { type: "text", index: false },
    previewUrl: { type: "keyword", index: false },
  },
};

export function createSearchClient(
  node = process.env.ELASTICSEARCH_URL,
): Client {
  if (!node) throw new Error("ELASTICSEARCH_URL is required");
  return new Client({ node });
}

export async function ensureEmailIndex(client: Client): Promise<void> {
  if (await client.indices.exists({ index: EMAIL_INDEX })) return;

  try {
    await client.indices.create({
      index: EMAIL_INDEX,
      mappings: EMAIL_INDEX_MAPPINGS,
    });
  } catch (error) {
    const type = (
      error as { meta?: { body?: { error?: { type?: string } } } }
    ).meta?.body?.error?.type;
    if (type !== "resource_already_exists_exception") throw error;
  }
}

export async function indexEmail(
  client: Client,
  email: EmailSearchDocument,
): Promise<void> {
  await client.index({
    index: EMAIL_INDEX,
    id: email.id,
    document: email,
  });
}

function positiveInteger(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : fallback;
}

export function buildEmailSearchRequest(
  ownerId: string,
  options: SearchEmailsOptions = {},
): estypes.SearchRequest {
  const tenantId = ownerId.trim();
  if (!tenantId) throw new Error("ownerId is required");

  const page = positiveInteger(options.page, 1);
  const limit = Math.min(positiveInteger(options.limit, 20), 100);
  const q = options.q?.trim();
  const filter: estypes.QueryDslQueryContainer[] = [
    { term: { ownerId: tenantId } },
  ];
  if (options.status) filter.push({ term: { status: options.status } });

  return {
    index: EMAIL_INDEX,
    from: (page - 1) * limit,
    size: limit,
    track_total_hits: true,
    query: {
      bool: {
        filter,
        ...(q
          ? {
              must: [
                {
                  multi_match: {
                    query: q,
                    fields: ["recipient", "senderEmail", "subject", "body"],
                  },
                },
              ],
            }
          : {}),
      },
    },
    sort: [{ scheduledAt: "desc" }, { id: "asc" }],
  };
}

export async function searchEmails(
  client: Client,
  ownerId: string,
  options: SearchEmailsOptions = {},
): Promise<SearchEmailsResult> {
  const request = buildEmailSearchRequest(ownerId, options);
  const response = await client.search<EmailSearchDocument>(request);
  const total = response.hits.total;

  return {
    items: response.hits.hits.flatMap((hit) =>
      hit._source ? [hit._source] : [],
    ),
    total: typeof total === "number" ? total : (total?.value ?? 0),
    page: request.from! / request.size! + 1,
    limit: request.size!,
  };
}
