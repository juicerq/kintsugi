import { useCallback, useState } from "react";

export function useSessionStatus() {
	const [isLoading, setIsLoading] = useState(true);
	const [isThinking, setIsThinking] = useState(false);
	const [isStopped, setIsStopped] = useState(false);

	const startThinking = useCallback(() => {
		setIsThinking(true);
		setIsStopped(false);
	}, []);

	const stopThinking = useCallback(() => {
		setIsThinking(false);
	}, []);

	const markStopped = useCallback(() => {
		setIsStopped(true);
		setIsThinking(false);
	}, []);

	const markResumed = useCallback(() => {
		setIsStopped(false);
	}, []);

	return {
		isLoading,
		isThinking,
		isStopped,
		setLoading: setIsLoading,
		startThinking,
		stopThinking,
		markStopped,
		markResumed,
	};
}

export type SessionStatus = ReturnType<typeof useSessionStatus>;
