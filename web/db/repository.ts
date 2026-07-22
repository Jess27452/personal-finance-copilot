import { env } from "cloudflare:workers";
import type { Transaction } from "../lib/finance";
import { sampleTransactions } from "../lib/finance";

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    display_name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    category TEXT NOT NULL,
    confidence REAL NOT NULL,
    method TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'csv',
    created_at TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS transactions_owner_date_idx ON transactions(user_email, date)",
];

function database() {
  if (!env.DB) throw new Error("Database binding is unavailable.");
  return env.DB;
}

async function ensureSchema() {
  const db = database();
  await db.batch(schemaStatements.map((statement) => db.prepare(statement)));
}

export async function getUserTransactions(email: string, displayName: string): Promise<Transaction[]> {
  await ensureSchema();
  const db = database(); const now = new Date().toISOString();
  await db.prepare("INSERT INTO users (email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name, updated_at = excluded.updated_at").bind(email, displayName, now, now).run();
  const count = await db.prepare("SELECT COUNT(*) AS count FROM transactions WHERE user_email = ?").bind(email).first<{ count: number }>();
  if (!count?.count) await saveTransactions(email, sampleTransactions, "sample");
  const result = await db.prepare("SELECT id, date, description, amount, category, confidence, method FROM transactions WHERE user_email = ? ORDER BY date DESC, created_at DESC").bind(email).all<Transaction>();
  return result.results;
}

export async function saveTransactions(email: string, transactions: Transaction[], source = "csv") {
  await ensureSchema();
  const db = database(); const now = new Date().toISOString();
  const statements = transactions.map((item) => db.prepare("INSERT OR REPLACE INTO transactions (id, user_email, date, description, amount, category, confidence, method, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(item.id, email, item.date, item.description, item.amount, item.category, item.confidence, item.method, source, now));
  for (let index = 0; index < statements.length; index += 80) await db.batch(statements.slice(index, index + 80));
}
