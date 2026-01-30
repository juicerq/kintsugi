import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function getDataDir(): string {
	const xdgDataHome =
		process.env.XDG_DATA_HOME || join(homedir(), ".local/share");
	return join(xdgDataHome, "kintsugi");
}

export const DATA_DIR = getDataDir();
export const DB_PATH = join(DATA_DIR, "kintsugi.db");
export const LOGS_DIR = join(DATA_DIR, "logs");
export const SESSIONS_DIR = join(LOGS_DIR, "sessions");
export const DAILY_DIR = join(LOGS_DIR, "daily");

let dirsEnsured = false;

export function ensureDataDirs() {
	if (dirsEnsured) return;
	for (const dir of [DATA_DIR, LOGS_DIR, SESSIONS_DIR, DAILY_DIR]) {
		if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
	}
	dirsEnsured = true;
}
