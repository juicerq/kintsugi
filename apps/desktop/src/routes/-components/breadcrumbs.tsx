import { useLocation, Link } from "@tanstack/react-router";

interface BreadcrumbSegment {
	label: string;
	href?: string;
}

function buildBreadcrumbs(pathname: string): BreadcrumbSegment[] {
	const segments: BreadcrumbSegment[] = [{ label: "Kintsugi", href: "/" }];

	if (pathname === "/") {
		segments.push({ label: "Projects" });
		return segments;
	}

	// Future: handle /projects/$id and deeper routes
	// For now, just handle the index route

	return segments;
}

export function Breadcrumbs() {
	const location = useLocation();
	const segments = buildBreadcrumbs(location.pathname);

	return (
		<nav className="flex items-center gap-2 text-sm">
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
