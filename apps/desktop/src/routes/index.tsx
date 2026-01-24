import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import reactLogo from "../assets/react.svg";
import { trpc } from "../trpc";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const [name, setName] = useState("");
	const [submittedName, setSubmittedName] = useState("");

	const greetQuery = trpc.greet.useQuery(
		{ name: submittedName },
		{ enabled: submittedName.length > 0 },
	);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmittedName(name);
	}

	return (
		<main className="container">
			<h1>Welcome to Tauri + React</h1>

			<div className="row">
				<a href="https://vite.dev" target="_blank" rel="noopener">
					<img src="/vite.svg" className="logo vite" alt="Vite logo" />
				</a>
				<a href="https://tauri.app" target="_blank" rel="noopener">
					<img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
				</a>
				<a href="https://react.dev" target="_blank" rel="noopener">
					<img src={reactLogo} className="logo react" alt="React logo" />
				</a>
			</div>
			<p>Click on the Tauri, Vite, and React logos to learn more.</p>

			<form className="row" onSubmit={handleSubmit}>
				<input
					id="greet-input"
					value={name}
					onChange={(e) => setName(e.currentTarget.value)}
					placeholder="Enter a name..."
				/>
				<button type="submit">Greet</button>
			</form>
			<p>{greetQuery.data ?? ""}</p>
		</main>
	);
}
