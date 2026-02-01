import { useCallback, useState } from "react";
import type { SessionSummary } from "@/lib/types";

export function useSessionModals() {
	const [showSessionModal, setShowSessionModal] = useState(false);
	const [showHistory, setShowHistory] = useState(false);
	const [existingSessions, setExistingSessions] = useState<SessionSummary[]>(
		[],
	);

	const closeAll = useCallback(() => {
		setShowSessionModal(false);
		setShowHistory(false);
	}, []);

	return {
		showSessionModal,
		setShowSessionModal,
		showHistory,
		setShowHistory,
		existingSessions,
		setExistingSessions,
		closeAll,
	};
}

export type SessionModals = ReturnType<typeof useSessionModals>;
