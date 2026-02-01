import { uiEventBus } from "../events/bus";
import type { UiInvalidateEvent } from "../events/types";
import { logger } from "../lib/logger";

/**
 * SDK Message types from @anthropic-ai/claude-agent-sdk
 * Using local definitions to avoid deep import path issues
 */

type SDKToolProgressMessage = {
	type: "tool_progress";
	tool_use_id: string;
	tool_name: string;
	parent_tool_use_id: string | null;
	elapsed_time_seconds: number;
	uuid: string;
	session_id: string;
};

type SDKPartialAssistantMessage = {
	type: "stream_event";
	event: BetaRawMessageStreamEvent;
	parent_tool_use_id: string | null;
	uuid: string;
	session_id: string;
};

/**
 * Anthropic Beta streaming event types
 * These represent the raw events from the API during streaming
 */
type BetaRawMessageStreamEvent =
	| BetaContentBlockStartEvent
	| BetaContentBlockDeltaEvent
	| BetaContentBlockStopEvent
	| BetaMessageStartEvent
	| BetaMessageDeltaEvent
	| BetaMessageStopEvent;

type BetaContentBlockStartEvent = {
	type: "content_block_start";
	index: number;
	content_block: BetaContentBlock;
};

type BetaContentBlockDeltaEvent = {
	type: "content_block_delta";
	index: number;
	delta: BetaContentBlockDelta;
};

type BetaContentBlockStopEvent = {
	type: "content_block_stop";
	index: number;
};

type BetaMessageStartEvent = {
	type: "message_start";
	message: unknown;
};

type BetaMessageDeltaEvent = {
	type: "message_delta";
	delta: unknown;
	usage?: unknown;
};

type BetaMessageStopEvent = {
	type: "message_stop";
};

type BetaContentBlock =
	| { type: "text"; text: string }
	| { type: "thinking"; thinking: string }
	| { type: "tool_use"; id: string; name: string; input: unknown };

type BetaContentBlockDelta =
	| { type: "text_delta"; text: string }
	| { type: "thinking_delta"; thinking: string }
	| { type: "input_json_delta"; partial_json: string };

/**
 * Generic SDK message that could be any type from the stream
 */
type SDKMessage = {
	type: string;
	session_id?: string;
	[key: string]: unknown;
};

/**
 * Internal state for tracking thinking blocks
 */
type ThinkingState = {
	isActive: boolean;
	content: string;
	blockIndex: number | null;
};

/**
 * Internal state for tracking active tool_use blocks
 */
type ActiveTool = {
	toolUseId: string;
	toolName: string;
	blockIndex: number;
};

type ToolsState = {
	activeTools: Map<number, ActiveTool>; // blockIndex -> ActiveTool
};

/**
 * Emitter function type for publishing UI events
 */
type EventEmitter = (event: UiInvalidateEvent) => void;

/**
 * Processes SDK stream messages and emits UI events for thinking and tool progress.
 *
 * This module translates the low-level SDK streaming events into high-level UI events
 * that the frontend can use to show real-time progress during AI operations.
 *
 * Key responsibilities:
 * - Extract thinking blocks from streaming events and emit session.thinking events
 * - Emit session.toolProgress events when tools are running
 * - Track thinking state (started/delta/completed) across content blocks
 */

/**
 * Process a streaming message from the SDK and emit appropriate UI events.
 *
 * @param message - The SDK message from the stream
 * @param sessionId - The session ID (used if not present in message)
 * @param emit - Function to emit UI events (defaults to uiEventBus.publish)
 * @param thinkingState - Mutable state for tracking thinking blocks across calls
 * @param toolsState - Mutable state for tracking active tools across calls
 */
export function processStreamMessage(
	message: SDKMessage,
	sessionId: string,
	emit: EventEmitter = (event) => uiEventBus.publish(event),
	thinkingState: ThinkingState = createThinkingState(),
	toolsState: ToolsState = createToolsState(),
): void {
	const resolvedSessionId = message.session_id ?? sessionId;

	if (message.type === "tool_progress") {
		const toolMsg = message as SDKToolProgressMessage;
		logger.info("Emitting tool progress from SDK", {
			sessionId: resolvedSessionId,
			toolName: toolMsg.tool_name,
			toolUseId: toolMsg.tool_use_id,
		});
		processToolProgressFromSDK(toolMsg, resolvedSessionId, emit);
		return;
	}

	if (message.type === "stream_event") {
		const streamMsg = message as SDKPartialAssistantMessage;
		logger.info("Processing stream event", {
			sessionId: resolvedSessionId,
			eventType: streamMsg.event?.type,
		});
		processStreamEvent(
			streamMsg,
			resolvedSessionId,
			emit,
			thinkingState,
			toolsState,
		);
		return;
	}
}

/**
 * Create initial thinking state
 */
export function createThinkingState(): ThinkingState {
	return {
		isActive: false,
		content: "",
		blockIndex: null,
	};
}

/**
 * Create initial tools state
 */
export function createToolsState(): ToolsState {
	return {
		activeTools: new Map(),
	};
}

/**
 * Process a tool_progress message from SDK and emit UI event
 */
function processToolProgressFromSDK(
	message: SDKToolProgressMessage,
	sessionId: string,
	emit: EventEmitter,
): void {
	emit({
		type: "session.toolProgress",
		sessionId,
		toolName: message.tool_name,
		toolUseId: message.tool_use_id,
		elapsedSeconds: message.elapsed_time_seconds,
		isActive: true,
	});
}

/**
 * Process a stream_event (partial assistant message) and emit thinking/tool events
 */
function processStreamEvent(
	message: SDKPartialAssistantMessage,
	sessionId: string,
	emit: EventEmitter,
	thinkingState: ThinkingState,
	toolsState: ToolsState,
): void {
	const event = message.event;

	if (!event || typeof event !== "object") {
		return;
	}

	switch (event.type) {
		case "content_block_start":
			handleContentBlockStart(
				event,
				sessionId,
				emit,
				thinkingState,
				toolsState,
			);
			break;

		case "content_block_delta":
			handleContentBlockDelta(event, sessionId, emit, thinkingState);
			break;

		case "content_block_stop":
			handleContentBlockStop(event, sessionId, emit, thinkingState, toolsState);
			break;
	}
}

/**
 * Handle content_block_start event - detect thinking or tool_use block starting
 */
function handleContentBlockStart(
	event: BetaContentBlockStartEvent,
	sessionId: string,
	emit: EventEmitter,
	thinkingState: ThinkingState,
	toolsState: ToolsState,
): void {
	const block = event.content_block;

	logger.info("Content block start", {
		sessionId,
		blockType: block.type,
		index: event.index,
	});

	if (block.type === "thinking") {
		thinkingState.isActive = true;
		thinkingState.content = block.thinking ?? "";
		thinkingState.blockIndex = event.index;

		logger.info("Emitting thinking start", {
			sessionId,
			contentLength: thinkingState.content.length,
		});
		emit({
			type: "session.thinking",
			sessionId,
			content: thinkingState.content,
			isActive: true,
		});
		return;
	}

	if (block.type === "tool_use") {
		const activeTool: ActiveTool = {
			toolUseId: block.id,
			toolName: block.name,
			blockIndex: event.index,
		};
		toolsState.activeTools.set(event.index, activeTool);

		logger.info("Emitting tool start", {
			sessionId,
			toolName: block.name,
			toolUseId: block.id,
		});
		emit({
			type: "session.toolProgress",
			sessionId,
			toolName: block.name,
			toolUseId: block.id,
			elapsedSeconds: 0,
			isActive: true,
		});
	}
}

/**
 * Handle content_block_delta event - accumulate thinking content
 */
function handleContentBlockDelta(
	event: BetaContentBlockDeltaEvent,
	sessionId: string,
	emit: EventEmitter,
	state: ThinkingState,
): void {
	// Only process deltas for active thinking blocks
	if (!state.isActive || event.index !== state.blockIndex) {
		return;
	}

	const delta = event.delta;

	if (delta.type === "thinking_delta") {
		state.content += delta.thinking;

		logger.info("Emitting thinking delta", {
			sessionId,
			contentLength: state.content.length,
		});
		emit({
			type: "session.thinking",
			sessionId,
			content: state.content,
			isActive: true,
		});
	}
}

/**
 * Handle content_block_stop event - mark thinking or tool as completed
 */
function handleContentBlockStop(
	event: BetaContentBlockStopEvent,
	sessionId: string,
	emit: EventEmitter,
	thinkingState: ThinkingState,
	toolsState: ToolsState,
): void {
	// Check if this is a thinking block stop
	if (thinkingState.isActive && event.index === thinkingState.blockIndex) {
		logger.info("Emitting thinking stop", {
			sessionId,
			contentLength: thinkingState.content.length,
		});
		emit({
			type: "session.thinking",
			sessionId,
			content: thinkingState.content,
			isActive: false,
		});

		// Reset thinking state
		thinkingState.isActive = false;
		thinkingState.content = "";
		thinkingState.blockIndex = null;
		return;
	}

	// Check if this is a tool_use block stop
	const activeTool = toolsState.activeTools.get(event.index);
	if (activeTool) {
		logger.info("Emitting tool stop", {
			sessionId,
			toolName: activeTool.toolName,
			toolUseId: activeTool.toolUseId,
		});
		emit({
			type: "session.toolProgress",
			sessionId,
			toolName: activeTool.toolName,
			toolUseId: activeTool.toolUseId,
			elapsedSeconds: 0,
			isActive: false,
		});

		// Remove from active tools
		toolsState.activeTools.delete(event.index);
	}
}

/**
 * Extract thinking content from a complete BetaMessage content array.
 * Useful for processing final assistant messages.
 *
 * @param content - Array of content blocks from BetaMessage
 * @returns Array of thinking text strings
 */
export function extractThinkingFromContent(
	content: Array<{ type: string; thinking?: string }>,
): string[] {
	return content
		.filter(
			(block): block is { type: "thinking"; thinking: string } =>
				block.type === "thinking" && typeof block.thinking === "string",
		)
		.map((block) => block.thinking);
}

/**
 * Check if an SDK message is a tool_progress message
 */
export function isToolProgressMessage(
	message: SDKMessage,
): message is SDKToolProgressMessage {
	return message.type === "tool_progress";
}

/**
 * Check if an SDK message is a stream_event (partial assistant message)
 */
export function isPartialAssistantMessage(
	message: SDKMessage,
): message is SDKPartialAssistantMessage {
	return message.type === "stream_event";
}
