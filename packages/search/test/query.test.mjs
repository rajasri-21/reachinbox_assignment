import assert from "node:assert/strict";
import test from "node:test";

import { buildEmailSearchRequest } from "../dist/index.js";

test("search always filters by tenant and applies optional filters", () => {
  const request = buildEmailSearchRequest(" tenant-a ", {
    q: " launch ",
    status: "sent",
    page: 2,
    limit: 25,
  });

  assert.deepEqual(request.query.bool.filter, [
    { term: { ownerId: "tenant-a" } },
    { term: { status: "sent" } },
  ]);
  assert.equal(request.query.bool.must[0].multi_match.query, "launch");
  assert.equal(request.from, 25);
  assert.equal(request.size, 25);
});

test("search rejects an empty tenant and bounds pagination", () => {
  assert.throws(() => buildEmailSearchRequest("  "), /ownerId is required/);

  const request = buildEmailSearchRequest("tenant-a", { page: -1, limit: 999 });
  assert.equal(request.from, 0);
  assert.equal(request.size, 100);
});
