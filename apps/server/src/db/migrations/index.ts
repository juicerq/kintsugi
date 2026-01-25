import { promises as fs } from "node:fs"
import path from "node:path"
import { Kysely, Migrator, FileMigrationProvider } from "kysely"
import type { Database } from "../types"

export async function runMigrations(db: Kysely<Database>) {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, "."),
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((result) => {
    if (result.status === "Success") {
      console.log(`Migration "${result.migrationName}" applied`)
    } else if (result.status === "Error") {
      console.error(`Migration "${result.migrationName}" failed`)
    }
  })

  if (error) {
    console.error("Migration failed:", error)
    throw error
  }
}
