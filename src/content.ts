export type Project = {
  slug: string;
  title: string;
  year: string;
  /** Plain description a recruiter understands without context. Leads the work list. */
  what: string;
  /** The hardest thing in it. The hook, used on the detail page. */
  problem: string;
  stack: string[];
  repo?: string;
  live?: string;
  /** Two or three paragraphs for the detail page. */
  body: string[];
  /** Left column = stage, right column = what happens there. Rendered as the flow diagram. */
  flow?: { stage: string; detail: string }[];
  /** Short, checkable facts. Rendered in mono. */
  facts?: { label: string; value: string }[];
  /** Explicitly not shipped. Keeps the page honest. */
  notShipped?: string;
};

export const projects: Project[] = [
  {
    slug: "centralized-exchange",
    title: "Centralized Exchange",
    year: "2026",
    what: "A crypto exchange backend: seven services, a live order book, and an engine that matches buy and sell orders in real time.",
    problem:
      "Keeping an order book correct while seven services change it at once, and recovering it after a crash.",
    stack: [
      "TypeScript",
      "Kafka",
      "Redis",
      "PostgreSQL",
      "TimescaleDB",
      "WebSockets",
      "Docker",
    ],
    repo: "https://github.com/manas987/Centralized-Exchange",
    body: [
      "A trading platform split into seven services that coordinate over Kafka. Orders enter through an API gateway, get validated against wallet balances, and are published as events. The matching service holds the order book in memory and matches bids against asks on FIFO price-time priority — limit and market orders, partial fills, separate books per side.",
      "The interesting part is not the matching. It is that the book lives in one process's memory while the money lives in Postgres and the ticks live in TimescaleDB, and all three have to agree. The persistence service writes order-book and wallet snapshots so the engine can be rebuilt by replaying events from the last good state. The stream service fans trades out to WebSocket clients through Redis pub/sub, so the thing clients see and the thing the engine believes stay in step.",
      "Kafka is doing real work here rather than sitting in the dependency list. An HTTP request produces an event tagged with a correlation ID and holds the response open until a consumer emits the matching reply — asynchronous coordination underneath a synchronous-looking API.",
    ],
    flow: [
      { stage: "API gateway", detail: "HTTP ingress, routing, rate limits" },
      {
        stage: "Trading service",
        detail: "Order placement, publishes to Kafka",
      },
      {
        stage: "Matching service",
        detail: "In-memory book, FIFO price-time priority",
      },
      {
        stage: "Persistence service",
        detail: "Snapshots and trades → Postgres + TimescaleDB",
      },
      { stage: "Stream service", detail: "Redis pub/sub → WebSocket clients" },
    ],
    facts: [
      { label: "Services", value: "7" },
      { label: "Matching", value: "FIFO price-time priority" },
      { label: "Recovery", value: "Snapshot + event replay" },
      { label: "Time series", value: "TimescaleDB" },
    ],
    notShipped:
      "An engineering build, not a production exchange. No latency benchmarks have been run. Perpetual futures — leverage, liquidation, funding rates — are in progress, not shipped.",
  },
  {
    slug: "bella",
    title: "Bella",
    year: "2026",
    what: "A voice assistant that runs entirely on your own machine — it hears you, understands you and answers, with nothing sent to a server.",
    problem:
      "Five processes all wanted the microphone. The fix was deciding which one owns it.",
    stack: [
      "Python",
      "TypeScript",
      "Whisper.cpp",
      "Ollama",
      "Qwen3",
      "Silero VAD",
      "Kokoro",
    ],
    repo: "https://github.com/manas987/Local_AI_Assistant",
    body: [
      "A voice assistant that runs entirely on the machine — nothing leaves it. Wake word, voice activity detection, speech to text, a local language model, and speech back out, chained end to end: OpenWakeWord listens, Silero VAD decides when you have stopped talking, Whisper.cpp transcribes, Qwen3 runs under Ollama, Kokoro speaks.",
      "The first architecture had every stage opening its own audio stream, and they fought over the device. The rewrite gave one Python audio engine sole ownership of the microphone and moved everything else behind a Node orchestration layer that talks to it over events. Recording runs until silence rather than for a fixed window, and temporary audio is deleted once it has been transcribed.",
      "It runs on a base-model M4 MacBook. Qwen3 4B at 4096 context, quantized, is the configuration that fits.",
    ],
    flow: [
      { stage: "OpenWakeWord", detail: "Always-on wake word" },
      { stage: "Silero VAD", detail: "Record until silence" },
      { stage: "Whisper.cpp", detail: "Local transcription" },
      { stage: "Qwen3 via Ollama", detail: "Local inference, 4096 context" },
      { stage: "Kokoro", detail: "Speech synthesis" },
    ],
    facts: [
      { label: "Network calls", value: "0" },
      { label: "Model", value: "Qwen3 4B, quantized" },
      { label: "Mic owner", value: "One Python process" },
    ],
    notShipped:
      "Memory, tool use, multi-step reasoning and desktop control are designed but not built. The pipeline that works today is wake → record → transcribe → infer → speak.",
  },
  {
    slug: "agent-harness",
    title: "AI Agent Harness",
    year: "2026",
    what: "A command-line AI agent that can read and write files, built without an agent framework so every part of the loop is visible.",
    problem:
      "Writing the tool-calling loop by hand, because using a framework teaches you nothing about it.",
    stack: ["Bun", "TypeScript", "Gemini", "OpenAI", "Anthropic", "xAI"],
    repo: "https://github.com/manas987/AI-agent-harness",
    body: [
      "A CLI agent with no agent framework underneath it. The loop — send messages, read the tool calls back, execute them, feed the results in, repeat until the model stops asking — is written out rather than imported. Three tools: read a file, write a file, list a directory.",
      "It speaks to four providers behind one interface, and keeps conversation history and API keys in a local config file that is gitignored and created on first run. The point was to understand what a framework is doing before depending on one.",
    ],
    facts: [
      { label: "Tools", value: "readFile · writeFile · listFile" },
      { label: "Providers", value: "4" },
      { label: "Agent framework", value: "None" },
    ],
  },
  {
    slug: "realtime-chat",
    title: "Real-Time Chat",
    year: "2025",
    what: "A full-stack messaging app: accounts, search, chat history, and messages that arrive instantly over a live connection.",
    problem:
      "Authenticating a connection that stays open, when the auth system was built for requests that do not.",
    stack: ["React", "TypeScript", "Express", "ws", "MongoDB", "JWT"],
    repo: "https://github.com/manas987/Chat-app",
    live: "https://chat-app-coral-six-16.vercel.app",
    body: [
      "Messaging over raw WebSockets rather than a realtime service. REST handles login, history and user search; the socket handles delivery. The server keeps a map from user ID to live connection, writes each message to MongoDB, then pushes it to the recipient if they are connected.",
      "Most of the work was in the parts that are not the happy path: carrying a JWT identity onto a persistent connection, handling the connection lifecycle, and deciding what happens to a message whose recipient is not currently attached.",
    ],
    facts: [
      { label: "Transport", value: "ws, no realtime SaaS" },
      { label: "Auth", value: "JWT + bcrypt" },
    ],
  },
  {
    slug: "life-os",
    title: "LifeOS",
    year: "2025",
    what: "A personal dashboard that tracks money, tasks and habits in one place, with charts and automatic alerts.",
    problem:
      "The one project with a real interface: a personal dashboard sustained across 59 commits.",
    stack: [
      "React 19",
      "Vite 7",
      "Tailwind",
      "shadcn/ui",
      "Recharts",
      "dnd-kit",
    ],
    repo: "https://github.com/manas987/Life-OS",
    live: "https://life-os-one-tawny.vercel.app",
    body: [
      "A personal dashboard that tracks tasks, money and habits in one place — income against expenses, category breakdowns, drag-and-drop task lists, streaks, subscriptions, multi-account balances, and alerts for the things that quietly go wrong (an overdue task, a broken streak, a subscription about to renew).",
      "It is the most actively developed repository of the set, and the one that carries frontend range rather than systems depth.",
    ],
    facts: [
      { label: "Commits", value: "59" },
      { label: "Deployed", value: "Vercel" },
    ],
  },
];

export const experience = {
  company: "Ascendlink Technologies",
  role: "Software Engineer Intern",
  period: "Jun — Jul 2026",
  mode: "Remote",
  intro:
    "Backend work on an analytics product, mostly spent making slow things fast and collapsing three ad platforms into one interface.",
  // The two ClickHouse figures are separate queries, but nothing on record says which —
  // so they share one labelled column rather than two columns with the same name.
  wins: [
    {
      label: "Dashboard analytical queries",
      deltas: [{ from: "5.6s", to: "200ms" }],
    },
    {
      label: "ClickHouse response times",
      deltas: [
        { from: "2s", to: "780ms" },
        { from: "550ms", to: "400ms" },
      ],
    },
  ],
  notes: [
    "Built proxy-based Google Ads and Meta Ads integrations that expose one unified backend interface, so the frontend stops caring which platform a number came from.",
    "Developed Backend-for-Frontend services to centralise business logic out of the client.",
  ],
};

export const about = {
  lead: ["A practice built on", "reading the machine."],
  leadEmphasis: "reading",
  body: [
    "I learn infrastructure by building the thing itself. Every project here started as a question I could not answer by reading — how does a matching engine stay correct, how does Kafka coordinate a request that has to wait, what actually happens between a microphone and a model — and turned into a system I had to debug.",
    "The pattern repeats: pick something harder than I can currently build, get a simplified version working, hit the real problem, go read the mechanism, refactor, add the next layer. The interesting work is always in the second half.",
    "That has pulled me toward distributed backends, real-time systems, matching engines, local AI pipelines and query performance — the places where correctness depends on timing and nothing is true for very long.",
  ],
};

export const skills = [
  {
    group: "Languages",
    items: ["TypeScript", "JavaScript", "Python", "C++", "HTML", "CSS"],
  },
  {
    group: "Frameworks", // Fixed casing
    items: ["Next.js", "Django", "Express", "Flask", "FastAPI", "Fastify"], // Added Next.js here if you want it listed as a framework
  },
  {
    group: "Backend",
    items: [
      "REST APIs",
      "WebSockets",
      "WebRTC", // Fixed casing
      "Kafka",
      "Redis",
      "BullMQ",
      "Celery",
    ],
  },
  {
    group: "Data & Databases",
    items: [
      "PostgreSQL",
      "TimescaleDB",
      "MongoDB",
      "ClickHouse",
      "Raw SQL Queries",
    ],
  },
  {
    group: "AI & Local Inference", // Fixed casing
    items: [
      "Whisper.cpp",
      "Silero VAD",
      "Kokoro TTS",
      "RAG",
      "LangChain",
      "LangGraph",
    ],
  },
  {
    group: "Frontend & UI",
    items: ["React", "Tailwind CSS"],
  },
  {
    group: "Infra & Tooling", // Fixed casing
    items: ["Docker", "Kubernetes", "Git", "Linux", "Turborepo"],
  },
];

export const cp = {
  label: "Codeforces",
  value: "Pupil · 1258 · 508 solved",
  href: "https://codeforces.com/profile/memyself",
};

export const sections = [
  { id: "index", label: "Index" },
  { id: "work", label: "Selected work" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];
