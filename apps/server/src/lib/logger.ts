import {
	existsSync,
	mkdirSync,
	readdirSync,
	statSync,
	unlinkSync,
} from "node:fs";
import { appendFile } from "node:fs/promises";
import { join } from "node:path";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;
type Writer = (path: string, data: string) => Promise<void>;

const LOGS_DIR = join(import.meta.dir, "../../logs");
const SESSIONS_DIR = join(LOGS_DIR, "sessions");
const DAILY_DIR = join(LOGS_DIR, "daily");
const RETENTION_DAYS = 30;
const FLUSH_INTERVAL_MS = 100;
const MAX_CONTENT_LENGTH = 1024;

const SENSITIVE_PATTERNS = [
	/sk-[a-zA-Z0-9]{20,}/g,
	/ghp_[a-zA-Z0-9]{36}/g,
	/Bearer [a-zA-Z0-9\-._~+/]+=*/g,
];

function sanitize(str: string): string {
	let result = str;
	for (const pattern of SENSITIVE_PATTERNS) {
		result = result.replace(pattern, "[REDACTED]");
	}
	return result;
}

function truncate(str: string, max = MAX_CONTENT_LENGTH): string {
	if (str.length <= max) return str;
	return `${str.slice(0, max)}...[truncated ${str.length - max} chars]`;
}

class AsyncLogger {
	private buffers = new Map<string, string[]>();
	private flushTimer: Timer | null = null;
	private dirsEnsured = false;
	private writer: Writer;
	private droppedCount = 0;

	constructor(writer?: Writer) {
		this.writer = writer ?? this.defaultWriter;
	}

	private async defaultWriter(path: string, data: string) {
		await appendFile(path, data);
	}

	private ensureDirs() {
		if (this.dirsEnsured) return;
		for (const dir of [LOGS_DIR, SESSIONS_DIR, DAILY_DIR]) {
			if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
		}
		this.dirsEnsured = true;
	}

	private todayFile() {
		return join(DAILY_DIR, `${new Date().toISOString().split("T")[0]}.jsonl`);
	}

	private sessionFile(sessionId: string) {
		return join(SESSIONS_DIR, `${sessionId}.jsonl`);
	}

	private scheduleFlush() {
		if (this.flushTimer) return;
		this.flushTimer = setTimeout(() => this.flush(), FLUSH_INTERVAL_MS);
	}

	private async flush() {
		this.flushTimer = null;
		const entries = [...this.buffers.entries()];
		this.buffers.clear();

		for (const [path, lines] of entries) {
			try {
				await this.writer(path, `${lines.join("\n")}\n`);
				if (this.droppedCount > 0) {
					console.error(
						`[logger] Recovered after dropping ${this.droppedCount} entries`,
					);
					this.droppedCount = 0;
				}
			} catch (err) {
				this.droppedCount += lines.length;
				console.error(
					`[logger] Failed to write ${lines.length} entries to ${path}:`,
					err,
				);
			}
		}
	}

	private addToBuffer(path: string, entry: object) {
		const line = sanitize(JSON.stringify(entry));
		const buffer = this.buffers.get(path) ?? [];
		buffer.push(line);
		this.buffers.set(path, buffer);
		this.scheduleFlush();
	}

	log(level: LogLevel, msg: string, ctx?: LogContext & { sessionId?: string }) {
		this.ensureDirs();
		const entry = { ts: new Date().toISOString(), level, msg, ...ctx };

		this.addToBuffer(this.todayFile(), entry);

		if (ctx?.sessionId) {
			this.addToBuffer(this.sessionFile(ctx.sessionId), entry);
		}
	}

	debug = (msg: string, ctx?: LogContext) => this.log("debug", msg, ctx);
	info = (msg: string, ctx?: LogContext) => this.log("info", msg, ctx);
	warn = (msg: string, ctx?: LogContext) => this.log("warn", msg, ctx);
	error = (msg: string, err?: Error | null, ctx?: LogContext) =>
		this.log("error", msg, { ...ctx, error: err?.message, stack: err?.stack });

	forSession = (sessionId: string) => ({
		debug: (msg: string, ctx?: LogContext) =>
			this.log("debug", msg, { ...ctx, sessionId }),
		info: (msg: string, ctx?: LogContext) =>
			this.log("info", msg, { ...ctx, sessionId }),
		warn: (msg: string, ctx?: LogContext) =>
			this.log("warn", msg, { ...ctx, sessionId }),
		error: (msg: string, err?: Error | null, ctx?: LogContext) =>
			this.log("error", msg, {
				...ctx,
				sessionId,
				error: err?.message,
				stack: err?.stack,
			}),
	});

	async flushNow() {
		if (this.flushTimer) {
			clearTimeout(this.flushTimer);
			this.flushTimer = null;
		}
		await this.flush();
	}

	cleanup() {
		this.ensureDirs();
		const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

		for (const dir of [SESSIONS_DIR, DAILY_DIR]) {
			try {
				for (const file of readdirSync(dir)) {
					const path = join(dir, file);
					if (statSync(path).mtimeMs < cutoff) {
						unlinkSync(path);
					}
				}
			} catch (err) {
				console.error(`[logger] Cleanup failed for ${dir}:`, err);
			}
		}
	}
}

export const logger = new AsyncLogger();

export function createLogger(writer: Writer) {
	return new AsyncLogger(writer);
}

export { truncate };
