import { about, cp, experience, projects } from "../content";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;

const MAX_TURNS = 24;
const MAX_CHARS = 600;

function buildSystemPrompt() {
  const work = projects
    .map((p) =>
      [
        `## ${p.title} (${p.year}) — /work/${p.slug}`,
        `Hardest part: ${p.problem}`,
        `Stack: ${p.stack.join(", ")}`,
        p.repo ? `Repo: ${p.repo}` : "",
        p.live ? `Live: ${p.live}` : "",
        ...p.body,
        p.flow ? `Flow: ${p.flow.map((f) => `${f.stage} (${f.detail})`).join(" -> ")}` : "",
        p.facts ? p.facts.map((f) => `${f.label}: ${f.value}`).join("; ") : "",
        p.notShipped ? `NOT SHIPPED: ${p.notShipped}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");

  return `You are ${process.env.BUN_PUBLIC_CHAT_AGENT_NAME || "Manas 1.0"}, a small agent embedded in Manas Kushwaha's portfolio site. Visitors are mostly recruiters and engineers deciding whether to talk to him.

Answer only from the notes below. They are the complete record you have.

RULES
- Never invent a project, a number, a company, a date, a technology or a claim. If the notes do not cover it, say you do not know and suggest emailing him.
- Never describe the exchange as production or production-ready. It is an engineering build with no benchmarks.
- Bella's memory, tool use and desktop control are planned, not built. Say so if asked.
- He is early career. Do not inflate him into a senior engineer, but do not call him a student either — he presents as a working engineer.
- Write plainly, 2-4 sentences, no bullet lists, no markdown, no emoji. Match a technical peer, not a brochure.
- You may point to a project page path like /work/bella when it is useful.
- If asked something unrelated to Manas or his work, say that is outside what you cover, briefly.

# Manas Kushwaha
Based in Noida, India. Backend-oriented: distributed systems, real-time infrastructure, local AI.
${about.body.join("\n")}
Contact: ${process.env.BUN_PUBLIC_EMAIL || "see the contact section"}.

# Experience
${experience.company} — ${experience.role}, ${experience.period}, ${experience.mode}.
${experience.intro}
${experience.wins
  .map(
    (w) =>
      `${w.label}: ${w.deltas.map((d) => `${d.from} -> ${d.to}`).join(", ")}`,
  )
  .join("\n")}
${experience.notes.join("\n")}

# Projects
${work}

# Competitive programming
${cp.label}: ${cp.value}. Active, not expert. Do not oversell this.`;
}

// ponytail: in-memory per-IP window. Resets on cold start and is per-instance on Vercel, so
// it blunts a casual flood, not a determined one. Swap for Upstash/Redis if that matters.
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const LIMIT = 12;

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > LIMIT;
}

export async function handleChat(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return new Response("The chat agent is not configured.", { status: 503 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return new Response("Too many questions at once. Give it a minute.", {
      status: 429,
    });
  }

  let turns: { role: string; text: string }[];
  try {
    const body = (await request.json()) as { turns?: unknown };
    if (!Array.isArray(body.turns)) throw new Error("bad body");
    turns = body.turns
      .filter(
        (t): t is { role: string; text: string } =>
          !!t &&
          typeof t === "object" &&
          typeof (t as any).text === "string" &&
          ((t as any).role === "user" || (t as any).role === "model"),
      )
      .slice(-MAX_TURNS)
      .map((t) => ({ role: t.role, text: t.text.slice(0, MAX_CHARS) }));
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  if (!turns.length || turns[turns.length - 1]!.role !== "user") {
    return new Response("Bad request", { status: 400 });
  }

  const upstream = await fetch(ENDPOINT(MODEL), {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: buildSystemPrompt() }] },
      contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
      generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error("gemini error", upstream.status, detail.slice(0, 400));
    return new Response("The model is unreachable right now.", { status: 502 });
  }

  // Gemini speaks SSE; the browser only wants the words.
  const decoder = new TextDecoder();
  let buffer = "";

  const text = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            const parts = parsed?.candidates?.[0]?.content?.parts ?? [];
            for (const part of parts) {
              if (typeof part?.text === "string") {
                controller.enqueue(new TextEncoder().encode(part.text));
              }
            }
          } catch {
            // A partial SSE frame; the next chunk completes it.
          }
        }
      },
    }),
  );

  return new Response(text, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
