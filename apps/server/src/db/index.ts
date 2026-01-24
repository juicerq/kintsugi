import { Database as BunDatabase } from "bun:sqlite";
import { Kysely } from "kysely";
import { BunSqliteDialect } from "kysely-bun-sqlite";
import type { Database } from "./types";
import { initSchema } from "./schema";

const DB_PATH = process.env.KINTSUGI_DB_PATH || "kintsugi.db";

const sqlite = new BunDatabase(DB_PATH, { create: true });

// Enable foreign keys
sqlite.run("PRAGMA foreign_keys = ON");

// Initialize schema
initSchema(sqlite);

// Kysely instance for type-safe queries
export const db = new Kysely<Database>({
  dialect: new BunSqliteDialect({ database: sqlite }),
});
