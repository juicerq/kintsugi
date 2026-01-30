import { Code, FileText, FlaskConical, RefreshCw, Wrench } from "lucide-react";
import type { SubtaskCategory } from "./types";

export const categoryConfig: Record<
	SubtaskCategory,
	{ label: string; icon: React.ReactNode; activeStyle: string }
> = {
	code: {
		label: "Code",
		icon: <Code className="h-2.5 w-2.5" />,
		activeStyle: "bg-sky-500/20 text-sky-400",
	},
	test: {
		label: "Test",
		icon: <FlaskConical className="h-2.5 w-2.5" />,
		activeStyle: "bg-violet-500/20 text-violet-400",
	},
	docs: {
		label: "Docs",
		icon: <FileText className="h-2.5 w-2.5" />,
		activeStyle: "bg-indigo-500/20 text-indigo-400",
	},
	fix: {
		label: "Fix",
		icon: <Wrench className="h-2.5 w-2.5" />,
		activeStyle: "bg-rose-500/20 text-rose-400",
	},
	refactor: {
		label: "Refactor",
		icon: <RefreshCw className="h-2.5 w-2.5" />,
		activeStyle: "bg-emerald-500/20 text-emerald-400",
	},
};
