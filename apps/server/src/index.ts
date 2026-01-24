import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";

const PORT = 3001;

Bun.serve({
  port: PORT,
  fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/trpc")) {
      return fetchRequestHandler({
        endpoint: "/trpc",
        req: request,
        router: appRouter,
        createContext: () => ({}),
      });
    }

    return new Response("jask-server running", { status: 200 });
  },
});

console.log(`jask-server listening on http://localhost:${PORT}`);
