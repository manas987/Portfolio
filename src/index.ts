import { readdirSync } from "node:fs";
import { serve } from "bun";
import index from "./index.html";
import { handleChat } from "./server/chat";

// `bun build` does not know about public/, so the build script copies it into dist/. In dev
// we serve it from disk instead. Both paths end up at the same URLs.
const staticRoutes: Record<string, Response> = {};
for (const name of readdirSync("public", { recursive: true, encoding: "utf8" })) {
  const file = Bun.file(`public/${name}`);
  if (file.size > 0) staticRoutes[`/${name}`] = new Response(file);
}

const server = serve({
  routes: {
    ...staticRoutes,
    "/api/chat": { POST: handleChat },

    // Everything else is the app; the client router reads the path.
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Running at ${server.url}`);
