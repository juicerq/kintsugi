import { Breadcrumbs } from "./breadcrumbs";

export function Header() {
	return (
		<header className="flex items-center justify-between">
			<Breadcrumbs />
		</header>
	);
}
