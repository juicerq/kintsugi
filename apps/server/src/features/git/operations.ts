export async function getCurrentBranch(repoPath: string): Promise<string> {
	const proc = Bun.spawn(["git", "rev-parse", "--abbrev-ref", "HEAD"], {
		cwd: repoPath,
		stdout: "pipe",
		stderr: "pipe",
	});

	const exitCode = await proc.exited;

	if (exitCode !== 0) {
		const stderr = await new Response(proc.stderr).text();
		throw new Error(
			`Failed to get current branch: ${stderr.trim() || "unknown error"}`,
		);
	}

	const stdout = await new Response(proc.stdout).text();
	return stdout.trim();
}

export async function checkoutBranch(
	repoPath: string,
	branchName: string,
): Promise<string> {
	const proc = Bun.spawn(["git", "checkout", branchName], {
		cwd: repoPath,
		stdout: "pipe",
		stderr: "pipe",
	});

	const exitCode = await proc.exited;

	if (exitCode !== 0) {
		const stderr = await new Response(proc.stderr).text();
		throw new Error(
			`Failed to checkout branch '${branchName}': ${stderr.trim() || "unknown error"}`,
		);
	}

	return branchName;
}
