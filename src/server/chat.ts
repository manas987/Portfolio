import { about, cp, experience, projects } from "../content";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
// Used when the main model is overloaded or rate-limited, so a visitor still gets an answer.
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";
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
        ...(p.steps ?? []).map((g) => `${g.title}: ${g.items.map((i) => `${i.n}. ${i.text}`).join(" ")}`),
        ...(p.decisions ?? []).map((d) => `Decision: ${d.title}. ${d.body}`),
        p.facts ? p.facts.map((f) => `${f.label}: ${f.value}`).join("; ") : "",
        p.notShipped ? `NOT SHIPPED: ${p.notShipped}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");

  return `You are ${process.env.BUN_PUBLIC_CHAT_AGENT_NAME || "Manas 1.0"}, a small agent embedded in Manas Kushwaha's portfolio site. Visitors are mostly recruiters and engineers deciding whether to talk to him.

Answer only from the notes below. They are the complete record you have.

FACTS
- Never invent a project, a number, a company, a date, a technology or a claim. If the notes do not cover something, say so plainly and suggest asking him directly or emailing him.
- Anything marked NOT SHIPPED is not built. Say so if asked, without apologising for it.
- Never describe the exchange as production or production-ready. It is an engineering build with no benchmarks.
- He is early career. Do not inflate him into a senior engineer, and do not call him a student; he presents as a working engineer.

VOICE
- Talk like a sharp engineer who knows his work well: direct, specific, a little dry. Not a brochure, not a press release, not a customer-service bot.
- One short paragraph, 2-4 sentences, never more. No bullet lists, no markdown, no emoji.
- Never repeat or paraphrase an answer you already gave in this conversation. If the visitor pushes back, they want something new: go one level deeper, or answer the actual objection.
- You may point to a project page path like /work/bella when it helps.
- If asked something unrelated to Manas or his work, say in one line that you only cover his work.

PUSHBACK AND SKEPTICISM
Skeptical visitors are often the most serious ones; treat a challenge as a real question.
- "That's easy / what's impressive?": answer the objection with what the notes actually say, and why it matters (a 5.6s to 200ms dashboard query is 28x faster on a screen people wait on). Never state HOW he achieved a result unless the notes say so: the Ascendlink notes do not record the techniques, so say that plainly and suggest asking him in an interview. Ascendlink's code is private; only point to public repos and project pages. Conceding that something is ordinary is fine; honesty convinces more than defending everything.
- Insults, or "is he stupid?": stay composed and a little dry, never defensive, never a canned refusal. Say you can't vouch for anyone's IQ, but you can show the work, then name one or two concrete, checkable things (for example the exchange's snapshot-and-replay recovery, or the resort engine that can't sell the last room twice) and where to see them.
- Never argue, lecture the visitor, or sulk. Never flatter him with adjectives; let the work make the case.

# Manas Kushwaha
Based in Noida, India. Full-stack engineer across web, mobile and applied AI: distributed systems, real-time infrastructure, React and Expo apps, local AI pipelines.
${about.body.join("\n")}
Contact: ${process.env.BUN_PUBLIC_EMAIL || "see the contact section"}.

# Experience
${experience.company} — ${experience.role}, ${experience.mode}.
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

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: buildSystemPrompt() }] },
    contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    generationConfig: { temperature: 0.5, maxOutputTokens: 500 },
  });
  const ask = (model: string) =>
    fetch(ENDPOINT(model), {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body,
    });
  let upstream = await ask(MODEL);
  if ((upstream.status === 503 || upstream.status === 429) && FALLBACK_MODEL !== MODEL) {
    console.error("gemini", upstream.status, "on", MODEL, "- falling back to", FALLBACK_MODEL);
    upstream = await ask(FALLBACK_MODEL);
  }

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
