import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { Client } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Loads DATABASE_URL from server/.env.test — the same isolated `helpdesk_test`
// database the webServer's `dev:test` process connects to — without pulling in
// the generated Prisma client from `server/` (a separate npm project).
loadEnv({ path: path.resolve(__dirname, "../../../server/.env.test") });

// Re-exported for specs that need to hit routes (e.g. the inbound-email
// webhook) whose auth/behavior depends on the same server/.env.test values.
export const INBOUND_EMAIL_WEBHOOK_SECRET = process.env.INBOUND_EMAIL_WEBHOOK_SECRET as string;
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL as string;

/**
 * Runs a query directly against the `helpdesk_test` Postgres database and
 * closes the connection. Intended for one-off assertions/cleanup in specs
 * that test API-only behavior (no UI) and need to verify DB state.
 */
export async function queryDb<T = unknown>(text: string, values?: unknown[]): Promise<T[]> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query(text, values);
    return result.rows as T[];
  } finally {
    await client.end();
  }
}
