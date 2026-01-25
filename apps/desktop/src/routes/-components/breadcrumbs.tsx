import { useLocation, Link } from "@tanstack/react-router";
import { trpc } from "../../trpc";

interface BreadcrumbSegment {
	label: string;
	href?: string;
}

function useBreadcrumbs(pathname: string): BreadcrumbSegment[] {
	const [projects] = trpc.projects.list.useSuspenseQuery();

	const taskMatch = pathname.match(/^\/tasks\/([^/]+)/);
	const taskId = taskMatch?.[1] ?? null;

	const { data: task } = trpc.tasks.get.useQuery(
		{ id: taskId! },
		{ enabled: !!taskId }
	);

	const segments: BreadcrumbSegment[] = [{ label: "Kintsugi", href: "/" }];

	if (pathname === "/") {
		segments.push({ label: "Projects" });
		return segments;
	}

	const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
	if (projectMatch) {
		const projectId = projectMatch[1];
		const project = projects.find((p) => p.id === projectId);
		const projectName = project?.name ?? "Project";

		segments.push({ label: projectName, href: "/" });
		segments.push({ label: "Tasks" });
		return segments;
	}

	if (taskMatch && task) {
		const project = projects.find((p) => p.id === task.project_id);
		const projectName = project?.name ?? "Project";

		segments.push({ label: projectName, href: "/" });
		segments.push({
			label: "Tasks",
			href: `/projects/${task.project_id}`,
		});
		segments.push({ label: task.title });
	}

	return segments;
}

export function Breadcrumbs() {
	const location = useLocation();
	const segments = useBreadcrumbs(location.pathname);

	return (
		<nav className="flex items-center gap-2 text-sm border-b p-3 w-full">
			{segments.map((seg, i) => (
				<span key={i} className="flex items-center gap-2">
					{i > 0 && <span className="text-muted-foreground">/</span>}
					{seg.href && (
						<Link
							to={seg.href}
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							{seg.label}
						</Link>
					)}
					{!seg.href && (
						<span className="text-foreground font-medium">{seg.label}</span>
					)}
				</span>
			))}
		</nav>
	);
}
