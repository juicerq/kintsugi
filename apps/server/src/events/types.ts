export type UiInvalidateEvent =
	| { type: "subtask.updated"; subtaskId: string; taskId: string }
	| { type: "execution.started"; taskId: string }
	| { type: "execution.subtaskStarted"; taskId: string; subtaskId: string }
	| { type: "execution.subtaskCompleted"; taskId: string; subtaskId: string }
	| {
			type: "execution.subtaskFailed";
			taskId: string;
			subtaskId: string;
			error: string;
	  }
	| {
			type: "execution.stopped";
			taskId: string;
			reason: "user" | "error" | "completed";
	  };
