import { createClient, type Client } from "@libsql/client";

declare global {
  var __timecardDb: Client | undefined;
  var __timecardDbReady: Promise<void> | undefined;
}

function createDbClient(): Client {
  const url = process.env.DATABASE_URL ?? "file:./data/timecard.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  return createClient(authToken ? { url, authToken } : { url });
}

export function getDb(): Client {
  if (!global.__timecardDb) {
    global.__timecardDb = createDbClient();
  }
  return global.__timecardDb;
}

async function migrate(db: Client) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS punches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      time INTEGER NOT NULL,
      date_key TEXT NOT NULL
    )
  `);
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_punches_staff_date ON punches(staff_id, date_key)`
  );
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_punches_date ON punches(date_key)`
  );
}

export function ensureSchema(): Promise<void> {
  if (!global.__timecardDbReady) {
    global.__timecardDbReady = migrate(getDb());
  }
  return global.__timecardDbReady;
}
