import { Breadcrumbs } from "./breadcrumbs";

export function Header() {
	return (
		<header className="flex items-center justify-between px-6 py-4">
			<Breadcrumbs />
		</header>
	);
}
