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
	  }
	| {
			type: "session.statusChanged";
			sessionId: string;
			status: string;
			stopRequested: number;
	  }
	| {
			type: "session.newMessage";
			sessionId: string;
			messageCount: number;
	  }
	| {
			type: "session.stopped";
			sessionId: string;
			reason: "user" | "error" | "system";
	  };
