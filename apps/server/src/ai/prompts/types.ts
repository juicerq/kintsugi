export interface ProjectContext {
	name: string;
	path: string;
	description: string | null;
}

export interface TaskContext {
	title: string;
	description: string | null;
}

export interface SubtaskContext {
	name: string;
	acceptanceCriteria: string[];
	outOfScope: string[];
	category: string | null;
	shouldCommit: boolean;
	notes: string | null;
}

export interface BrainstormInput {
	project: ProjectContext;
	task: TaskContext;
	fileTree: string;
	projectDocs: string | null;
}

export interface ArchitectureInput {
	project: ProjectContext;
	task: TaskContext;
	brainstorm: string | null;
	fileTree: string;
	relevantFiles: { path: string; content: string }[];
}

export interface ReviewInput {
	project: ProjectContext;
	task: TaskContext;
	brainstorm: string | null;
	architecture: string;
}

export interface ExecuteInput {
	project: ProjectContext;
	task: TaskContext;
	subtask: SubtaskContext;
	architecture: string;
	review: string | null;
}
