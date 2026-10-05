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

    what: "A centralised exchange built around seven services, a live order book, and a matching engine that has to keep making the right decision as orders arrive. My most robust Backend project",

    problem:
      "The easy part was matching a buy with a sell. The hard part was keeping the whole system correct when seven services were changing the state around it — and rebuilding that state after a crash.",

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
      "I started with the obvious part: an order book that could match bids and asks in real time. Then the real engineering problem showed up. The order book lived in memory inside the matching service, wallets lived in Postgres, market data lived in TimescaleDB, and seven services had to agree on what had just happened.",

      "That forced the architecture to become a distributed system. Orders enter through an API gateway, get checked against wallet balances, and move through Kafka as events. The matching engine applies FIFO price-time priority to limit and market orders, including partial fills. A persistence service stores snapshots so the engine can recover from a known state and replay events instead of starting from zero.",

      "Then there was the part users actually see. Trades are pushed through Redis pub/sub and out over WebSockets, so the live market on screen follows the same state the engine believes is true. Kafka also became part of the request path: an HTTP request can publish an event with a correlation ID and wait for the matching response from another service. What started as an exchange project turned into a lesson in state, timing, recovery, and keeping different parts of a system in sync.",
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
      "This is an engineering build, not a production exchange. Latency benchmarks have not been run. Perpetual futures — leverage, liquidation, and funding rates — are still in progress.",
  },

  {
    slug: "bella",

    title: "Bella",

    year: "2026",

    what: "A voice assistant that runs entirely on your own machine offline: it listens, understands, and speaks without sending the conversation to a server. It uses Wake Word and VAD to offer a seemless voice to voice experience",

    problem:
      "The first version had five different processes trying to use one microphone. The breakthrough was not a better model. It was deciding who owns the microphone.",

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
      "The goal was simple: build a voice assistant that stays on the machine. The pipeline became a chain of small systems — OpenWakeWord listens for the wake word, Silero VAD decides when speech has ended, Whisper.cpp turns the audio into text, Qwen3 runs locally through Ollama, and Kokoro turns the answer back into speech.",

      "Then the first architecture broke. Every stage wanted to open its own audio stream, and the processes started fighting over the microphone. Instead of adding another workaround, I changed the ownership model: one Python audio engine owns the microphone, and the rest of the system talks to it through an event-driven Node orchestration layer. Recording now runs until silence, and temporary audio is deleted after transcription.",

      "The result is a working local pipeline on a base-model M4 MacBook, using a quantized Qwen3 4B model with a 4096-token context. The interesting lesson was that the hard part of a local AI system was not just running the model. It was making all the surrounding pieces behave like one reliable machine.",
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
      "Memory, tool use, multi-step reasoning, and desktop control are designed but not built. The pipeline that works today is wake → record → transcribe → infer → speak.",
  },

  {
    slug: "agent-harness",

    title: "AI Agent Harness",

    year: "2026",

    what: "A command-line AI agent harness, built without an agent framework so the entire tool-calling loop stays visible.",

    problem:
      "I wanted to understand what an agent framework actually does, so I wrote the loop myself instead of hiding it behind one.",

    stack: ["Bun", "TypeScript", "Gemini", "OpenAI", "Anthropic", "xAI"],

    repo: "https://github.com/manas987/AI-agent-harness",

    body: [
      "The project started with a question: what is an AI agent when you remove the framework? The answer turned into a small CLI that does the core loop explicitly — send messages, receive tool calls, run the requested tool, send the result back, and keep going until the model stops asking for work.",

      "There are only three tools: read a file, write a file, and list a directory. The simplicity is deliberate. With no framework underneath, every step is visible, which makes it much easier to understand where tool use, context, and control flow actually live.",

      "The same interface can talk to four model providers, while conversation history and API keys stay in a local gitignored config. The project was less about shipping another chatbot and more about removing the abstraction layer long enough to understand what is happening underneath it.",
    ],

    facts: [
      { label: "Tools", value: "readFile · writeFile · listFile" },
      { label: "Providers", value: "4" },
      { label: "Agent framework", value: "None" },
    ],
  },

  {
    slug: "smtp",

    title: "SMTP Engine",

    year: "2026",

    what: "An SMTP engine built from the protocol up — taking an email connection through the actual SMTP conversation instead of hiding it behind a mail library it handels things like DNS, TCP, TLS, DMARC, SPF. DKIM a full fledge email infra",

    problem:
      "Email looks simple from the outside. The interesting part is everything that has to happen between opening a connection and successfully completing the SMTP protocol.",

    stack: ["TypeScript", "Bun", "Turborepo", "SMTP"],

    repo: "https://github.com/manas987/SMTP",

    body: [
      "I wanted to understand what actually happens when an email is sent, so instead of reaching for an SMTP library, I started from the protocol itself. The project is about following the conversation from the first connection all the way through the SMTP command sequence and making the server behave correctly at each step.",

      "That meant dealing with the part that most applications normally hide: connections, commands, responses, protocol state, and what the other side expects at every point in the exchange. The goal was not to build another email UI — it was to build the piece underneath it and understand the protocol by making it work.",

      "The result was an SMTP engine that was able to perform the protocol correctly through to completion. The interesting part was that getting the protocol right was only half the experiment: testing an internet-facing mail server also exposed infrastructure constraints that had nothing to do with the implementation itself. The project ended up being as much about understanding the protocol as it was about discovering where software ends and the network around it begins.",
    ],

    facts: [
      { label: "Protocol", value: "SMTP" },
      { label: "Implementation", value: "Built from the protocol layer" },
      { label: "Runtime", value: "Bun" },
    ],
  },

  {
    slug: "realtime-chat",

    title: "Real-Time Chat",

    year: "2025",

    what: "A full-stack messaging app with accounts, search, chat history, and messages that arrive instantly over a persistent connection.",

    problem:
      "JWT authentication works naturally for requests that start and finish. A WebSocket connection does neither — so the real question was how an identity survives on a connection that stays open.",

    stack: ["React", "TypeScript", "Express", "ws", "MongoDB", "JWT"],

    repo: "https://github.com/manas987/Chat-app",

    live: "https://chat-app-coral-six-16.vercel.app",

    body: [
      "I wanted to understand realtime messaging without hiding it behind a realtime SaaS. REST handles login, history, and user search; raw WebSockets handle the part that actually needs to happen instantly. The server keeps track of which user owns which live connection, writes messages to MongoDB, and pushes them to the recipient when they are online.",

      "The interesting problems appeared outside the happy path. A JWT gives you an identity at the start of an HTTP request, but a socket can stay open for much longer. That meant working out how authentication crosses that boundary, how connections are created and destroyed, and what the system does when the person receiving a message is simply not connected.",

      "It is a smaller project than the exchange, but it taught the same underlying lesson: realtime software is mostly about managing state over time. Once a connection stays open, the system has to care about who is connected, what they were doing, and what happens when they disappear.",
    ],

    facts: [
      { label: "Transport", value: "ws, no realtime SaaS" },
      { label: "Auth", value: "JWT + bcrypt" },
    ],
  },
];

export const experience = {
  company: "Ascendlink Technologies",

  role: "Software Engineer Intern",

  period: "Jun — Jul 2026",

  mode: "Remote",

  intro:
    "Worked on the backend of an analytics product where the job was often less about adding features and more about making existing systems stop getting in the way.",

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
    "Built proxy-based Google Ads and Meta Ads integrations that exposed both platforms through one backend interface, so the frontend did not need to care where a number came from.",

    "Developed Backend-for-Frontend services that moved business logic out of the client and into a central backend layer.",
  ],
};

export const about = {
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
