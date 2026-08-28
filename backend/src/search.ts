import { createSearchClient } from "@reachinbox/search";

/** Shared Elasticsearch client used by the emails routes. */
export const searchClient = createSearchClient();
