import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("ships the Ledgerly dashboard and import flow", async () => {
  const [dashboard, layout, api] = await Promise.all([
    readFile(new URL("../app/components/finance-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/import/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(dashboard, /LEDGERLY/);
  assert.match(dashboard, /Monthly spending/);
  assert.match(dashboard, /Import bank transactions/);
  assert.match(layout, /Personal Finance Copilot/);
  assert.match(api, /parseCsv/);
  assert.match(api, /saveTransactions/);
  assert.doesNotMatch(`${dashboard}${layout}`, /codex-preview|react-loading-skeleton/i);
});

test("ships a custom social preview", async () => {
  await access(new URL("public/og.png", root));
});
