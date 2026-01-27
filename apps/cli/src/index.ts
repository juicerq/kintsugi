#!/usr/bin/env bun

const BASE_URL = process.env.KINTSUGI_URL ?? "http://localhost:3001";

type TrpcResult = {
	result?: { data?: unknown };
	error?: { message?: string; json?: { message?: string } };
};

async function query(path: string, input?: unknown): Promise<unknown> {
	const url = new URL(`/trpc/${path}`, BASE_URL);

	if (input !== undefined) {
		url.searchParams.set("input", JSON.stringify(input));
	}

	const res = await fetch(url);
	const body = (await res.json()) as TrpcResult;

	if (!res.ok || body.error) {
		const msg = body.error?.json?.message ?? body.error?.message ?? `Request failed: ${res.status}`;
		throw new Error(msg);
	}

	return body.result?.data;
}

async function mutate(path: string, input?: unknown): Promise<unknown> {
	const url = new URL(`/trpc/${path}`, BASE_URL);

	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input !== undefined ? input : {}),
	});

	const body = (await res.json()) as TrpcResult;

	if (!res.ok || body.error) {
		const msg = body.error?.json?.message ?? body.error?.message ?? `Request failed: ${res.status}`;
		throw new Error(msg);
	}

	return body.result?.data;
}

function parseFlags(args: string[]): Record<string, string> {
	const flags: Record<string, string> = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (!arg.startsWith("--")) continue;

		const key = arg.slice(2);

		if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
			flags[key] = args[i + 1];
			i++;
		} else {
			flags[key] = "true";
		}
	}

	return flags;
}

function print(data: unknown) {
	if (jsonMode) {
		console.log(JSON.stringify(data, null, 2));
		return;
	}

	if (Array.isArray(data)) {
		if (data.length === 0) {
			console.log("(empty)");
			return;
		}

		for (const item of data) {
			printItem(item);
		}

		return;
	}

	printItem(data);
}

function printItem(item: unknown) {
	if (item === null || item === undefined) {
		console.log("(not found)");
		return;
	}

	if (typeof item !== "object") {
		console.log(String(item));
		return;
	}

	const record = item as Record<string, unknown>;
	const id = record.id ?? "";
	const name = record.name ?? record.title ?? "";
	const status = record.status ?? "";

	const parts: string[] = [];

	if (id) parts.push(`\x1b[2m${id}\x1b[0m`);
	if (name) parts.push(`\x1b[1m${name}\x1b[0m`);
	if (status) parts.push(formatStatus(String(status)));

	if (parts.length > 0) {
		console.log(parts.join("  "));
	}

	for (const [key, value] of Object.entries(record)) {
		if (["id", "name", "title", "status"].includes(key)) continue;
		if (value === null || value === undefined) continue;

		const display =
			typeof value === "string" && value.length > 80
				? `${value.slice(0, 80)}...`
				: String(value);

		console.log(`  ${key}: ${display}`);
	}

	console.log();
}

function formatStatus(status: string): string {
	const colors: Record<string, string> = {
		waiting: "\x1b[90m",
		in_progress: "\x1b[33m",
		completed: "\x1b[32m",
		running: "\x1b[33m",
		idle: "\x1b[36m",
		paused: "\x1b[35m",
		stopped: "\x1b[31m",
		failed: "\x1b[31m",
	};

	const color = colors[status] ?? "";
	return `${color}[${status}]\x1b[0m`;
}

const commands: Record<string, Record<string, (args: string[]) => Promise<void>>> = {
	project: {
		list: async () => {
			print(await query("projects.list"));
		},

		create: async (args) => {
			const [name, path] = args;

			if (!name || !path) {
				console.error("Usage: kintsugi project create <name> <path>");
				process.exit(1);
			}

			print(await mutate("projects.create", { name, path }));
		},
	},

	task: {
		list: async (args) => {
			const [projectId] = args;

			if (!projectId) {
				console.error("Usage: kintsugi task list <project-id>");
				process.exit(1);
			}

			print(await query("tasks.list", { projectId }));
		},

		get: async (args) => {
			const [id] = args;

			if (!id) {
				console.error("Usage: kintsugi task get <task-id>");
				process.exit(1);
			}

			print(await query("tasks.get", { id }));
		},

		create: async (args) => {
			const [projectId, title, ...rest] = args;

			if (!projectId || !title) {
				console.error("Usage: kintsugi task create <project-id> <title> [--desc ...] [--branch ...]");
				process.exit(1);
			}

			const flags = parseFlags(rest);

			print(
				await mutate("tasks.create", {
					projectId,
					title,
					description: flags.desc,
					branchName: flags.branch,
				}),
			);
		},

		update: async (args) => {
			const [id, ...rest] = args;

			if (!id) {
				console.error("Usage: kintsugi task update <task-id> [--brainstorm ...] [--architecture ...] [--review ...]");
				process.exit(1);
			}

			const flags = parseFlags(rest);

			const input: Record<string, unknown> = { id };

			if (flags.brainstorm !== undefined) input.brainstorm = flags.brainstorm;
			if (flags.architecture !== undefined) input.architecture = flags.architecture;
			if (flags.review !== undefined) input.review = flags.review;

			print(await mutate("tasks.update", input));
		},

		complete: async (args) => {
			const [id] = args;

			if (!id) {
				console.error("Usage: kintsugi task complete <task-id>");
				process.exit(1);
			}

			print(await mutate("tasks.toggleComplete", { id }));
		},

		delete: async (args) => {
			const [id] = args;

			if (!id) {
				console.error("Usage: kintsugi task delete <task-id>");
				process.exit(1);
			}

			print(await mutate("tasks.delete", { id }));
		},
	},

	subtask: {
		list: async (args) => {
			const [taskId] = args;

			if (!taskId) {
				console.error("Usage: kintsugi subtask list <task-id>");
				process.exit(1);
			}

			print(await query("subtasks.list", { taskId }));
		},

		get: async (args) => {
			const [id] = args;

			if (!id) {
				console.error("Usage: kintsugi subtask get <subtask-id>");
				process.exit(1);
			}

			print(await query("subtasks.get", { id }));
		},

		create: async (args) => {
			const [taskId, name, ...rest] = args;

			if (!taskId || !name) {
				console.error("Usage: kintsugi subtask create <task-id> <name> [--category code|test|docs|fix|refactor]");
				process.exit(1);
			}

			const flags = parseFlags(rest);

			print(
				await mutate("subtasks.create", {
					taskId,
					name,
					category: flags.category,
				}),
			);
		},

		"create-batch": async (args) => {
			const [taskId, ...rest] = args;

			if (!taskId) {
				console.error("Usage: kintsugi subtask create-batch <task-id> --subtasks '<json array>'");
				process.exit(1);
			}

			const flags = parseFlags(rest);

			if (!flags.subtasks) {
				console.error("Missing --subtasks flag with JSON array");
				process.exit(1);
			}

			const subtasks = JSON.parse(flags.subtasks);

			print(await mutate("subtasks.createBatch", { taskId, subtasks }));
		},

		update: async (args) => {
			const [id, ...rest] = args;

			if (!id) {
				console.error("Usage: kintsugi subtask update <id> [--status ...] [--category ...] [--notes ...] [--name ...]");
				process.exit(1);
			}

			const flags = parseFlags(rest);
			const input: Record<string, unknown> = { id };

			if (flags.status !== undefined) input.status = flags.status;
			if (flags.category !== undefined) input.category = flags.category;
			if (flags.notes !== undefined) input.notes = flags.notes;
			if (flags.name !== undefined) input.name = flags.name;
			if (flags["should-commit"] !== undefined) input.shouldCommit = flags["should-commit"] === "true";
			if (flags.files !== undefined) input.files = JSON.parse(flags.files);
			if (flags["key-decisions"] !== undefined) input.keyDecisions = JSON.parse(flags["key-decisions"]);
			if (flags["acceptance-criterias"] !== undefined) input.acceptanceCriterias = JSON.parse(flags["acceptance-criterias"]);
			if (flags["out-of-scope"] !== undefined) input.outOfScope = JSON.parse(flags["out-of-scope"]);

			print(await mutate("subtasks.update", input));
		},

		complete: async (args) => {
			const [id] = args;

			if (!id) {
				console.error("Usage: kintsugi subtask complete <subtask-id>");
				process.exit(1);
			}

			print(await mutate("subtasks.update", { id, status: "completed" }));
		},

		delete: async (args) => {
			const [id] = args;

			if (!id) {
				console.error("Usage: kintsugi subtask delete <subtask-id>");
				process.exit(1);
			}

			print(await mutate("subtasks.delete", { id }));
		},
	},

	ai: {
		sessions: async (args) => {
			const [service, ...rest] = args;

			if (!service) {
				console.error("Usage: kintsugi ai sessions <claude|opencode> --project-id <uuid>");
				process.exit(1);
			}

			const flags = parseFlags(rest);

			if (!flags["project-id"]) {
				console.error("Missing --project-id");
				process.exit(1);
			}

			print(
				await query("ai.sessions.list", {
					service,
					scope: { projectId: flags["project-id"] },
					limit: flags.limit ? Number(flags.limit) : undefined,
				}),
			);
		},

		"session-get": async (args) => {
			const [service, sessionId] = args;

			if (!service || !sessionId) {
				console.error("Usage: kintsugi ai session-get <claude|opencode> <session-id>");
				process.exit(1);
			}

			print(await query("ai.sessions.get", { service, sessionId }));
		},

		messages: async (args) => {
			const [service, sessionId, ...rest] = args;

			if (!service || !sessionId) {
				console.error("Usage: kintsugi ai messages <claude|opencode> <session-id>");
				process.exit(1);
			}

			const flags = parseFlags(rest);

			print(
				await query("ai.messages.list", {
					service,
					sessionId,
					limit: flags.limit ? Number(flags.limit) : undefined,
				}),
			);
		},

		send: async (args) => {
			const [service, sessionId, ...contentParts] = args;

			if (!service || !sessionId || contentParts.length === 0) {
				console.error("Usage: kintsugi ai send <claude|opencode> <session-id> <message>");
				process.exit(1);
			}

			const content = contentParts.join(" ");

			print(
				await mutate("ai.messages.send", {
					service,
					sessionId,
					content,
				}),
			);
		},

		pause: async (args) => {
			const [service, sessionId] = args;

			if (!service || !sessionId) {
				console.error("Usage: kintsugi ai pause <claude|opencode> <session-id>");
				process.exit(1);
			}

			print(await mutate("ai.sessions.pause", { service, sessionId }));
		},

		resume: async (args) => {
			const [service, sessionId] = args;

			if (!service || !sessionId) {
				console.error("Usage: kintsugi ai resume <claude|opencode> <session-id>");
				process.exit(1);
			}

			print(await mutate("ai.sessions.resume", { service, sessionId }));
		},

		stop: async (args) => {
			const [service, sessionId] = args;

			if (!service || !sessionId) {
				console.error("Usage: kintsugi ai stop <claude|opencode> <session-id>");
				process.exit(1);
			}

			print(await mutate("ai.sessions.stop", { service, sessionId }));
		},
	},
};

function showHelp() {
	console.log(`
\x1b[1mkintsugi\x1b[0m - CLI for Kintsugi task management

\x1b[1mUsage:\x1b[0m
  kintsugi [--json] <resource> <action> [args] [flags]

\x1b[1mResources:\x1b[0m
  project   list | create <name> <path>
  task      list <project-id> | get <id> | create <project-id> <title> | update <id> | complete <id> | delete <id>
  subtask   list <task-id> | get <id> | create <task-id> <name> | create-batch <task-id> | update <id> | complete <id> | delete <id>
  ai        sessions <service> | session-get <service> <id> | messages <service> <id> | send <service> <id> <msg> | pause | resume | stop

\x1b[1mFlags:\x1b[0m
  --json              Output raw JSON
  --desc              Task description
  --branch            Task branch name
  --brainstorm        Task brainstorm content
  --architecture      Task architecture content
  --review            Task review content
  --category          Subtask category (code|test|docs|fix|refactor)
  --status            Subtask status (waiting|in_progress|completed)
  --notes             Subtask notes
  --project-id        AI session project scope

\x1b[1mEnv:\x1b[0m
  KINTSUGI_URL        Server URL (default: http://localhost:3001)

\x1b[1mExamples:\x1b[0m
  kintsugi project list
  kintsugi task create 550e8400-... "Implement auth" --branch "feat/auth"
  kintsugi subtask complete 550e8400-...
  kintsugi --json subtask list 550e8400-...
`);
}

let jsonMode = false;

const rawArgs = process.argv.slice(2);

if (rawArgs.includes("--json")) {
	jsonMode = true;
	rawArgs.splice(rawArgs.indexOf("--json"), 1);
}

const [resource, action, ...rest] = rawArgs;

if (!resource || !action || resource === "help" || resource === "--help") {
	showHelp();
	process.exit(0);
}

const resourceCommands = commands[resource];

if (!resourceCommands) {
	console.error(`Unknown resource: ${resource}`);
	console.error(`Available: ${Object.keys(commands).join(", ")}`);
	process.exit(1);
}

const handler = resourceCommands[action];

if (!handler) {
	console.error(`Unknown action: ${resource} ${action}`);
	console.error(`Available: ${Object.keys(resourceCommands).join(", ")}`);
	process.exit(1);
}

handler(rest).catch((err: Error) => {
	console.error(`\x1b[31mError:\x1b[0m ${err.message}`);
	process.exit(1);
});
