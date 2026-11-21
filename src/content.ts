export type Project = {
  slug: string;
  title: string;
  /** Products are things people use; builds are engineering studies. Products list first. */
  kind: "product" | "build";
  year: string;
  /** One short line, centred at the top of the card. */
  tagline: string;
  /** Two colours for the card's blurred blob. */
  tint: [string, string];
  /** Optional generated art (public/work/<slug>-art.png). Replaces the blob when set. */
  image?: string;
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

const all: Project[] = [
  {
    slug: "centralized-exchange",
    kind: "build",
    tagline: "Event-driven trading system",
    tint: ["#7aa2ff", "#c9d8ff"],
    image: "/work/centralized-exchange-art.webp",
    title: "Centralized Exchange",
    year: "2026",
    what: "A seven-service exchange with an in-memory order book, a matching engine, and Kafka-based event flow between services.",
    problem: "Keeping an in-memory order book consistent across seven services, and recoverable after a crash.",
    stack: ["TypeScript", "Kafka", "Redis", "PostgreSQL", "TimescaleDB", "WebSockets", "Docker"],
    repo: "https://github.com/manas987/Centralized-Exchange",
    body: [
      "Orders pass through an API gateway and a wallet check, then flow over Kafka to a matching engine that applies FIFO price-time priority, including partial fills. The engine snapshots its state and replays events on restart. Trades stream to clients over Redis pub/sub and WebSockets.",
    ],
    flow: [
      { stage: "API gateway", detail: "HTTP ingress and routing" },
      { stage: "Auth & wallet service", detail: "Sessions and balance checks" },
      { stage: "Trading service", detail: "Places orders onto Kafka" },
      { stage: "Matching service", detail: "In-memory book, FIFO price-time priority" },
      { stage: "Persistence service", detail: "Snapshots and trades → Postgres + TimescaleDB" },
      { stage: "Stream service", detail: "Redis pub/sub → WebSocket clients" },
    ],
    facts: [
      { label: "Services", value: "7" },
      { label: "Matching", value: "FIFO price-time priority" },
      { label: "Recovery", value: "Snapshot + event replay" },
      { label: "Time series", value: "TimescaleDB" },
    ],
    notShipped: "Engineering build, not a production exchange. Latency benchmarks not yet run; perpetual futures in progress.",
  },

  {
    slug: "resort-booking",
    kind: "build",
    tagline: "Transactional booking engine",
    tint: ["#b08968", "#e9dcc9"],
    image: "/work/resort-booking-art.webp",
    title: "Resort Booking",
    year: "2026",
    what: "Direct booking for a 76-key resort, with an AI-assisted enquiry inbox for staff.",
    problem: "Guaranteeing the last room can never be sold twice under concurrent bookings.",
    stack: ["TypeScript", "Bun", "Express", "PostgreSQL", "React", "Zod", "Gemini"],
    repo: "https://github.com/manas987/Resort-Booking",
    body: [
      "Built to a client brief. Each booking locks its room-nights in a fixed order and rechecks availability before committing, so it reserves every night or none. Prices and tax are computed server-side and snapshotted at purchase. Enquiries are classified and drafted by Gemini, with low-confidence cases routed to a manager and nothing sent without review.",
    ],
    flow: [
      { stage: "Quote", detail: "Backend prices every night" },
      { stage: "Hold", detail: "Lock nights, recheck, reserve all or none" },
      { stage: "Payment", detail: "Idempotent, late payments refunded" },
      { stage: "Confirmed booking", detail: "Prices and tax snapshotted" },
    ],
    facts: [
      { label: "Inventory", value: "64 rooms + 12 villas" },
      { label: "Tables", value: "28" },
      { label: "Endpoints", value: "30 guest · 55 staff" },
      { label: "Payment hold", value: "10 minutes" },
      { label: "AI review threshold", value: "Confidence < 0.60" },
    ],
    notShipped: "Payments and messaging are mocked per the brief; data is synthetic. Not publicly deployed.",
  },

  {
    slug: "retromobi",
    kind: "build",
    tagline: "Web and mobile rental marketplace",
    tint: ["#68afa7", "#f0dfc3"],
    image: "/work/retromobi-art.webp",
    title: "RetroMobi",
    year: "2026",
    what: "A scooter rental marketplace for India: a web app and two Expo apps, for riders and rental shops, on one backend.",
    problem: "Reconciling payments that arrive as a booking hold expires, before the hold is released.",
    stack: ["TypeScript", "Bun", "Express", "PostgreSQL", "React", "Expo", "Cashfree"],
    repo: "https://github.com/manas987/RetroMobi",
    body: [
      "A modular-monolith Express API serves rider, shop and admin route trees. A PostgreSQL exclusion constraint prevents double booking, holds expire after 15 minutes, and every payment and deposit movement is recorded as a ledger entry. The rider and shop apps share one API client and cover booking, handover, returns, fleet management and payouts.",
    ],
    flow: [
      { stage: "Browse", detail: "Approved, on-licence vehicles only" },
      { stage: "Hold", detail: "15 minutes, no double booking" },
      { stage: "Verify + pay", detail: "Licence check, aggregator holds money" },
      { stage: "Pickup", detail: "Inspection video, register written" },
      { stage: "Return", detail: "Inspection, deposit settled by ledger" },
    ],
    facts: [
      { label: "Apps", value: "Web · rider · shop" },
      { label: "Booking hold", value: "15 minutes" },
      { label: "Double booking", value: "PostgreSQL exclusion constraint" },
      { label: "Route trees", value: "Rider · shop · admin" },
    ],
    notShipped: "Backend complete and tested. Mobile apps verified on an Android emulator; real-device testing, native payments and store release pending.",
  },

  {
    slug: "bella",
    kind: "build",
    tagline: "On-device voice assistant",
    tint: ["#ff7a9c", "#ffd0b8"],
    image: "/work/bella-art.webp",
    title: "Bella",
    year: "2026",
    what: "A macOS voice assistant that runs entirely on-device, with spoken replies and system control.",
    problem: "Coordinating wake word, speech detection, transcription, inference and speech around a single microphone owner.",
    stack: ["Python", "TypeScript", "OpenWakeWord", "Silero VAD", "Whisper.cpp", "Ollama", "Kokoro"],
    repo: "https://github.com/manas987/Local_AI_Assistant",
    body: [
      "A Python process owns audio capture, wake-word detection and end-of-speech detection; a Node layer orchestrates Whisper.cpp transcription, a local model through Ollama, and Kokoro speech. Tool calls control volume, apps, music and the clipboard. Replies can be interrupted, and older context is summarised to keep the window small.",
    ],
    flow: [
      { stage: "OpenWakeWord", detail: "Always-on wake word" },
      { stage: "Silero VAD", detail: "Record until silence" },
      { stage: "Whisper.cpp", detail: "Local transcription" },
      { stage: "Ollama", detail: "Local model, tool calls" },
      { stage: "Kokoro", detail: "Speech synthesis" },
    ],
    facts: [
      { label: "Network calls", value: "0" },
      { label: "Model", value: "Llama 3.2 3B via Ollama" },
      { label: "Follow-up window", value: "5 seconds" },
      { label: "Mic owner", value: "One Python process" },
    ],
    notShipped: "Multi-step reasoning across tool calls is planned.",
  },

  {
    slug: "smtp",
    kind: "build",
    tagline: "Email delivery infrastructure",
    tint: ["#f2b35b", "#ffe7c2"],
    image: "/work/smtp-art.webp",
    title: "SMTP Engine",
    year: "2026",
    what: "Outbound email infrastructure that delivers directly to recipient mail servers, with DKIM signing and domain authentication. No mail library.",
    problem: "Separating temporary from permanent delivery failures, so mail is retried without hammering servers.",
    stack: ["TypeScript", "Bun", "BullMQ", "Redis", "PostgreSQL", "React"],
    repo: "https://github.com/manas987/SMTP",
    body: [
      "The engine resolves MX records, connects on port 25, upgrades with STARTTLS and runs the SMTP session directly. Messages are built as MIME and signed with DKIM. A BullMQ worker classifies every server response and retries only temporary failures. Domains must pass SPF, DKIM and DMARC checks before they can send.",
    ],
    flow: [
      { stage: "API", detail: "Queues the message" },
      { stage: "BullMQ worker", detail: "Checks verified domain, retries" },
      { stage: "MIME + DKIM", detail: "Builds and signs the message" },
      { stage: "MX lookup", detail: "Finds the recipient's server" },
      { stage: "SMTP session", detail: "EHLO, STARTTLS, MAIL, RCPT, DATA" },
    ],
    facts: [
      { label: "Mail library", value: "None" },
      { label: "Transport", value: "TCP :25 + STARTTLS" },
      { label: "Signing", value: "DKIM" },
      { label: "Domain checks", value: "SPF · DKIM · DMARC" },
    ],
  },

  {
    slug: "blueline",
    kind: "product",
    tagline: "Real-time work tracker",
    tint: ["#7497e8", "#d9eeff"],
    image: "/work/blueline-art.webp",
    title: "Blueline",
    year: "2026",
    what: "A work tracker for small teams, with boards, sections and issues that update live across clients.",
    problem: "Propagating board changes to every connected client without full reloads.",
    stack: ["Bun", "Express", "PostgreSQL", "WebSockets", "React", "Vite", "Tailwind CSS"],
    repo: "https://github.com/manas987/Trello",
    live: "https://trello-eta-eight.vercel.app",
    body: [
      "Permissions derive from a single source, the user's role in the owning organisation. Changes are written through an Express API to PostgreSQL, and a WebSocket event tells connected clients which records changed so they refetch only that data.",
    ],
    flow: [
      { stage: "React board", detail: "Moves an issue" },
      { stage: "Express API", detail: "Checks role, applies change" },
      { stage: "PostgreSQL", detail: "Stores board state" },
      { stage: "WebSocket", detail: "Tells other clients what changed" },
    ],
    facts: [
      { label: "Commits", value: "28" },
      { label: "Data model", value: "Org → board → section → issue" },
      { label: "Live updates", value: "WebSocket" },
    ],
    notShipped: "Password reset, attachments and per-board permissions are planned.",
  },

  {
    slug: "life-os",
    kind: "product",
    tagline: "Personal operations dashboard",
    tint: ["#b7d3a8", "#f5d9e4"],
    image: "/work/life-os-art.webp",
    title: "LifeOS",
    year: "2026",
    what: "A dashboard for tasks, habits and personal finance, with cross-domain charts and alerts.",
    problem: "Deriving one dashboard from three independent stores of state.",
    stack: ["React", "TypeScript", "Vite", "React Router", "Recharts", "Tailwind CSS", "dnd-kit"],
    repo: "https://github.com/manas987/Life-OS",
    live: "https://life-os-one-tawny.vercel.app",
    body: [
      "Tasks, habits and finances each keep their state in a dedicated hook, exposed through a shared context. The dashboard aggregates them into income and expense trends, category breakdowns, productivity charts and alerts for overdue tasks, broken streaks and upcoming subscriptions.",
    ],
    facts: [
      { label: "Areas", value: "Tasks · habits · finances" },
      { label: "Commits", value: "59" },
      { label: "Charts", value: "Recharts" },
    ],
  },

  {
    slug: "agent-harness",
    kind: "build",
    tagline: "Framework-free agent runtime",
    tint: ["#9b8cff", "#d8f0ff"],
    image: "/work/agent-harness-art.webp",
    title: "AI Agent Harness",
    year: "2026",
    what: "A command-line AI agent with the tool-calling loop implemented directly, without a framework.",
    problem: "Implementing the tool-calling loop directly, without an agent framework.",
    stack: ["Bun", "TypeScript", "Gemini", "OpenAI", "Anthropic", "xAI"],
    repo: "https://github.com/manas987/AI-agent-harness",
    body: [
      "The loop sends messages, executes the tool calls the model requests, returns the results and repeats until the model finishes. File tools are exposed to four model providers behind one interface, with keys and history stored in local, gitignored config.",
    ],
    facts: [
      { label: "Tools", value: "readFile · writeFile · listFile" },
      { label: "Providers", value: "4" },
      { label: "Agent framework", value: "None" },
    ],
  },

  {
    slug: "realtime-chat",
    kind: "product",
    tagline: "Real-time messaging",
    tint: ["#5ccfa8", "#d4f5e6"],
    image: "/work/realtime-chat-art.webp",
    title: "Real-Time Chat",
    year: "2025",
    what: "A messaging app with authentication, user search and persistent history, delivered over WebSockets.",
    problem: "Carrying authenticated identity from HTTP onto long-lived WebSocket connections.",
    stack: ["React", "TypeScript", "Express", "ws", "MongoDB", "JWT"],
    repo: "https://github.com/manas987/Chat-app",
    live: "https://chat-app-coral-six-16.vercel.app",
    body: [
      "REST handles authentication, search and history; WebSockets handle delivery. The server maps users to live connections, persists every message to MongoDB, and holds messages for offline recipients until they reconnect.",
    ],
    facts: [
      { label: "Transport", value: "ws, no realtime SaaS" },
      { label: "Auth", value: "JWT + bcrypt" },
      { label: "Storage", value: "MongoDB" },
    ],
  },

  {
    slug: "tic-tac-toe",
    kind: "product",
    tagline: "Multiplayer game server",
    tint: ["#ad94df", "#fce0cf"],
    image: "/work/tic-tac-toe-art.webp",
    title: "Multiplayer Tic Tac Toe",
    year: "2026",
    what: "Two-player Tic Tac Toe over WebSockets, with room codes and boards from 3×3 to 8×8.",
    problem: "Server-authoritative game state shared between two clients.",
    stack: ["Node.js", "ws", "React", "TypeScript", "Vite", "Tailwind CSS"],
    repo: "https://github.com/manas987/Tic-Tac-Toe-",
    live: "https://mutiplayer-tic-tac-toe-mern-stack.vercel.app",
    body: [
      "A Node WebSocket server owns each room's state, validates every move and broadcasts the result. Win detection is computed for the selected board size across rows, columns and both diagonals.",
    ],
    flow: [
      { stage: "React client", detail: "Sends the chosen cell" },
      { stage: "Room server", detail: "Validates the move, checks for a win" },
      { stage: "WebSocket", detail: "Broadcasts the new board" },
    ],
    facts: [
      { label: "Players per room", value: "2" },
      { label: "Board sizes", value: "3×3 to 8×8" },
      { label: "Transport", value: "WebSocket" },
    ],
  },

  {
    slug: "indianhikes-revamp",
    kind: "product",
    tagline: "Frontend redesign",
    tint: ["#609a86", "#d6eff5"],
    image: "/work/indianhikes-revamp-art.webp",
    title: "IndianHikes Revamp",
    year: "2026",
    what: "A frontend redesign concept for IndianHikes: trek discovery, listings and detail pages.",
    problem: "A consistent multi-page interface without a framework.",
    stack: ["HTML", "CSS", "JavaScript"],
    repo: "https://github.com/manas987/IndianHikes-Frontend-Revamp",
    live: "https://indianhikes-frontend-revamp.vercel.app",
    body: [
      "Trek discovery, listings and detail views are separate pages built in plain HTML, CSS and JavaScript, sharing one set of assets and scripts.",
    ],
    facts: [{ label: "Pages", value: "4" }],
  },

  {
    slug: "modi-bird",
    kind: "product",
    tagline: "Canvas browser game",
    tint: ["#f3ae78", "#ffe8ab"],
    image: "/work/modi-bird-art.webp",
    title: "Modi Bird",
    year: "2026",
    what: "A browser game rendered on an HTML canvas.",
    problem: "Input, physics and rendering in a single canvas loop.",
    stack: ["JavaScript", "HTML Canvas", "CSS"],
    repo: "https://github.com/manas987/Modi-Bird",
    live: "https://modibird-zeta.vercel.app",
    body: [
      "Each frame applies gravity, advances obstacles, checks collisions and redraws the scene. Input is routed by game state, and the best score persists in local storage.",
    ],
    facts: [{ label: "Canvas", value: "320 × 480" }],
  },
];

// Strongest work first. The PRODUCT / BUILD tag on each card carries the distinction.
const order = [
  "centralized-exchange",
  "resort-booking",
  "retromobi",
  "bella",
  "smtp",
  "blueline",
  "life-os",
  "agent-harness",
  "realtime-chat",
  "tic-tac-toe",
  "indianhikes-revamp",
  "modi-bird",
];
export const projects = order.map((slug) => all.find((p) => p.slug === slug)!);

/** Labels pinned around the head in the hero, koi-diagram style. */
export const callouts = [
  { code: "MX-01", label: "Matching engine", note: "Kafka, FIFO, replay", slug: "centralized-exchange" },
  { code: "BL-02", label: "Voice pipeline", note: "Offline, wake to speech", slug: "bella" },
  { code: "AH-03", label: "Agent loop", note: "No framework", slug: "agent-harness" },
  { code: "SM-04", label: "SMTP engine", note: "DKIM, STARTTLS, no library", slug: "smtp" },
];

export const experience = {
  company: "Ascendlink Technologies",

  role: "Software Engineer",


  mode: "Remote",

  intro: "Backend engineering on an analytics platform: query optimisation, ad-platform integrations and a Backend-for-Frontend layer.",

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
    "Unified the Google Ads and Meta Ads APIs behind a single backend interface.",
    "Moved business logic from the client into Backend-for-Frontend services.",
  ],
};

export const about = {
  /** The one line shown on the page. The chat agent still reads `body`. */
  summary:
    "Node, Express, MongoDB and PostgreSQL on the server, React on the web, Expo on mobile, and applied AI from local voice pipelines to LLM tooling.",

  lead: ["A practice built on", "reading the machine."],

  leadEmphasis: "reading",

  body: [
    "I learn infrastructure by building the thing itself. I start with a question I cannot answer from a tutorial — how does a matching engine stay correct, how does Kafka coordinate a request that has to wait, what actually happens between a microphone and a model — and then build enough of the system to run into the problem for real.",

    "That is usually where the interesting part begins. The first version breaks. I trace why. I read the mechanism underneath it, change the architecture, and try again. The pattern is simple: build something slightly beyond what I know, hit the part that is genuinely difficult, understand it, then build the next layer.",

    "That process has pulled me toward distributed backends, real-time systems, matching engines, local AI pipelines, and query performance — places where timing matters, state changes constantly, and a system that looks correct on paper still has to survive the real world.",
  ],
};

export const skills = [
  {
    group: "Languages",
    items: ["TypeScript", "JavaScript", "Python", "C++", "HTML", "CSS"],
  },
  {
    group: "Frameworks", // Fixed casing
    items: [
      "React",
      "Next.js",
      "Django",
      "Express",
      "Flask",
      "FastAPI",
      "Fastify",
    ], // Added Next.js here if you want it listed as a framework
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
    group: "Infra & Tooling", // Fixed casing
    items: ["Docker", "Kubernetes", "Git", "Linux", "Turborepo"],
  },
];

export const cp = {
  label: "Codeforces",
  value: "Pupil · 1258 · 508 solved",
  href: "https://codeforces.com/profile/memyself",
};

