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
  /** Numbered architecture diagram, drawn from the real repo. */
  diagram?: Diagram;
  /** Legend for the diagram: `n` matches an edge's `step`. */
  steps?: StepGroup[];
  /** Design decisions, title + paragraph. Backticks render as code. */
  decisions?: { title: string; body: string }[];
  /** Interface chips, e.g. "POST /orders". */
  api?: string[];
  demo?: "orderbook" | "booking-race";
  /** Short, checkable facts. Rendered in mono. */
  facts?: { label: string; value: string }[];
  /** Explicitly not shipped. Keeps the page honest. */
  notShipped?: string;
};

/** req = request path (blue), res = response (green), async = background/durability (purple). */
export type PathKind = "req" | "res" | "async" | "plain";

export type Diagram = {
  /** `at` is [column, row] on the diagram grid. */
  nodes: { id: string; label: string; sub?: string; at: [number, number]; tone?: PathKind; dashed?: boolean }[];
  /** `via` routes the line through grid points; `lane` nudges a straight line off-centre. */
  edges: { from: string; to: string; kind: PathKind; step?: string; label?: string; lane?: number; via?: [number, number][]; dashed?: boolean }[];
  groups?: { label: string; from: [number, number]; to: [number, number] }[];
};
export type DiagramEdge = Diagram["edges"][number];

export type StepGroup = { kind: PathKind; title: string; items: { n: string; text: string }[] };

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
    diagram: {
      nodes: [
        { id: "client", label: "Client", sub: "REST · WebSocket", at: [0, 0] },
        { id: "gateway", label: "API gateway", sub: "Express · JWT", at: [1, 0], tone: "req" },
        { id: "trading", label: "Trading", sub: "lock funds", at: [2, 0], tone: "req" },
        { id: "kafka", label: "Kafka", sub: "orders_created", at: [3, 0], tone: "req" },
        { id: "matching", label: "Matching", sub: "in-memory book", at: [4, 0], tone: "req" },
        { id: "stream", label: "Stream", sub: "WebSocket fan-out", at: [0, 1], tone: "res" },
        { id: "redis", label: "Redis", sub: "pub/sub", at: [1, 1], tone: "res" },
        { id: "persist", label: "Persistence", sub: "book copy + offset", at: [3, 1], tone: "res" },
        { id: "kafka2", label: "Kafka", sub: "order_completed", at: [4, 1], tone: "res" },
        { id: "pg", label: "Postgres", sub: "snapshots · users", at: [2.6, 2], tone: "async", dashed: true },
        { id: "tsdb", label: "TimescaleDB", sub: "trades hypertable", at: [3.8, 2], tone: "async", dashed: true },
      ],
      edges: [
        { from: "client", to: "gateway", kind: "req", step: "1" },
        { from: "gateway", to: "trading", kind: "req", step: "2" },
        { from: "trading", to: "kafka", kind: "req", step: "3" },
        { from: "kafka", to: "matching", kind: "req", step: "4" },
        { from: "matching", to: "kafka2", kind: "res", step: "5" },
        { from: "kafka2", to: "persist", kind: "res", step: "6" },
        { from: "persist", to: "redis", kind: "res", step: "7" },
        { from: "redis", to: "stream", kind: "res", step: "8" },
        { from: "stream", to: "client", kind: "res", step: "9" },
        { from: "persist", to: "pg", kind: "async", step: "S", via: [[2.6, 1.2]] },
        { from: "persist", to: "tsdb", kind: "async", step: "T", via: [[3.25, 1.6], [3.8, 1.6]] },
      ],
    },
    steps: [
      {
        kind: "req",
        title: "Order in",
        items: [
          { n: "1", text: "The client places an order over REST." },
          { n: "2", text: "The gateway verifies the JWT and forwards it to the trading service." },
          { n: "3", text: "Trading moves the cost from available to locked, then publishes the order." },
          { n: "4", text: "The matching service consumes `orders_created` and runs it against the book." },
        ],
      },
      {
        kind: "res",
        title: "Result out",
        items: [
          { n: "5", text: "The match result and book delta are published to `order_completed`." },
          { n: "6", text: "Persistence applies the delta to its copy of the book." },
          { n: "7", text: "It publishes the update and any trades to Redis channels per symbol." },
          { n: "8", text: "The stream service holds the Redis subscriptions." },
          { n: "9", text: "Subscribed clients receive book and trade updates over WebSocket." },
        ],
      },
      {
        kind: "async",
        title: "Durability",
        items: [
          { n: "S", text: "**Snapshot.** Each book is written to Postgres with the Kafka offset it reflects, after every message and on a 10-minute timer." },
          { n: "T", text: "**Trades.** Every fill is inserted into a TimescaleDB hypertable." },
          { n: "R", text: "**Recovery.** On restart, matching rebuilds its books from the snapshot and persistence resumes Kafka from the stored offset." },
        ],
      },
    ],
    decisions: [
      {
        title: "Price levels in a sorted map",
        body: "Each side of a book is an `OrderedMap<price, Order[]>`, a red-black tree. The best ask is the front, the best bid is the back, and each level is a FIFO queue, so priority is price first, then time. Fills happen at the resting order's price.",
      },
      {
        title: "Funds are locked before the order exists",
        body: "The trading service checks the balance and moves the order's cost from available to locked before anything is published. Settlement spends from the lock, and whatever is left when the order finishes is released.",
      },
      {
        title: "Market orders never rest",
        body: "A limit order's unfilled remainder is added to the book. A market order walks the opposite side until it fills or the side is empty, and any remainder is dropped rather than left as a resting order with no price.",
      },
      {
        title: "The log is the source of truth",
        body: "Memory is fast but disposable. A snapshot records the Kafka offset it was taken at, so a restart loads the snapshot and replays only what came after. Consumers validate each message and skip malformed ones instead of crashing the loop.",
      },
    ],
    api: ["POST /orders", "GET /orders", "GET /markets/:symbol/orderbook", "GET /markets/:symbol/trades", "POST /wallet/deposit", "POST /auth/magic-link"],
    demo: "orderbook",
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
    diagram: {
      nodes: [
        { id: "guest", label: "Guest", sub: "React booking flow", at: [0, 0] },
        { id: "api", label: "Express API", sub: "Zod · Idempotency-Key", at: [1, 0], tone: "req" },
        { id: "quote", label: "Quote", sub: "GST per room-night", at: [2, 0], tone: "req" },
        { id: "hold", label: "Hold", sub: "lock · recheck", at: [3, 0], tone: "req" },
        { id: "pay", label: "Payment", sub: "mock, per brief", at: [1, 1], tone: "res" },
        { id: "confirm", label: "Confirm", sub: "dedupe by event key", at: [2, 1], tone: "res" },
        { id: "pg", label: "PostgreSQL", sub: "booking_nights", at: [3, 1] },
        { id: "jobs", label: "Job queue", sub: "in Postgres", at: [4, 1], tone: "async", dashed: true },
        { id: "gemini", label: "Gemini", sub: "classify · draft", at: [4, 2], tone: "async", dashed: true },
        { id: "staff", label: "Staff inbox", sub: "human review", at: [3, 2], tone: "async", dashed: true },
      ],
      edges: [
        { from: "guest", to: "api", kind: "req", step: "1" },
        { from: "api", to: "quote", kind: "req", step: "2" },
        { from: "quote", to: "hold", kind: "req", step: "3" },
        { from: "hold", to: "pg", kind: "req", step: "4", label: "all nights or none" },
        { from: "api", to: "pay", kind: "res", step: "5" },
        { from: "pay", to: "confirm", kind: "res", step: "6" },
        { from: "confirm", to: "pg", kind: "res", step: "7" },
        { from: "jobs", to: "pg", kind: "async", step: "E" },
        { from: "jobs", to: "gemini", kind: "async", step: "A" },
        { from: "gemini", to: "staff", kind: "async", step: "G" },
      ],
    },
    steps: [
      {
        kind: "req",
        title: "Hold",
        items: [
          { n: "1", text: "The guest asks for a quote, then a hold, each with an `Idempotency-Key`." },
          { n: "2", text: "The backend prices every night and picks the GST bracket per room, per night." },
          { n: "3", text: "The hold is created from that quote, which stays valid for 5 minutes." },
          { n: "4", text: "Room-nights are locked in a fixed order, availability is rechecked, and every night is inserted or none." },
        ],
      },
      {
        kind: "res",
        title: "Payment",
        items: [
          { n: "5", text: "The guest pays within the 10-minute hold." },
          { n: "6", text: "The payment arrives as a ledger event with a unique key." },
          { n: "7", text: "Confirmation runs once per key. A payment that lands after the hold lapsed is refunded, never rebooked." },
        ],
      },
      {
        kind: "async",
        title: "Background",
        items: [
          { n: "E", text: "**Expiry.** A job marks lapsed holds expired. Availability already ignores them the moment they lapse." },
          { n: "A", text: "**Enquiries.** Gemini classifies each enquiry and drafts a reply against a strict schema." },
          { n: "G", text: "**Review.** Staff send every reply themselves; confidence below 0.60 goes to the general manager." },
        ],
      },
    ],
    decisions: [
      {
        title: "The database decides who gets the last room",
        body: "`lockRoomDays` takes `FOR UPDATE` locks on each room-night, always sorted by room type then date, so two bookings can't deadlock. `assertAvailable` then recounts confirmed bookings and live holds while the locks are held. A booking reserves every night it asked for, or the transaction rolls back.",
      },
      {
        title: "No stored counter",
        body: "Committed inventory is always counted from `booking_nights` joined to live bookings. An expired hold stops blocking a room the instant it lapses, so the expiry job tidies status and is never in the correctness path.",
      },
      {
        title: "The backend owns every amount",
        body: "Totals, discounts and statuses sent by a client are ignored, not validated. Money is integer paise, tax is decided per room per night on the post-discount value, and prices, tax version and terms are snapshotted onto the booking so a later rate change never moves a sold total.",
      },
      {
        title: "Retries are safe by construction",
        body: "A repeated request with the same `Idempotency-Key` replays the stored response, and a different body under the same key is a 409. A redelivered payment event is a no-op, and at most one refund exists per payment.",
      },
    ],
    demo: "booking-race",
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
    diagram: {
      nodes: [
        { id: "rider", label: "Rider app", sub: "Expo · web", at: [0, 0] },
        { id: "api", label: "Express API", sub: "rider · shop · admin", at: [1, 0], tone: "req" },
        { id: "cashfree", label: "Cashfree", sub: "payment order", at: [2, 0], tone: "req" },
        { id: "webhook", label: "Webhook", sub: "dedupe by event id", at: [3, 0], tone: "res" },
        { id: "shop", label: "Shop app", sub: "Expo · fleet", at: [0, 1] },
        { id: "pg", label: "PostgreSQL", sub: "GiST exclusion", at: [1, 1], tone: "req" },
        { id: "sweeps", label: "Sweeps", sub: "30 s timers", at: [2, 1], tone: "async", dashed: true },
      ],
      edges: [
        { from: "rider", to: "api", kind: "req", step: "1" },
        { from: "api", to: "pg", kind: "req", step: "2", label: "HOLD · 15 min" },
        { from: "api", to: "cashfree", kind: "req", step: "3" },
        { from: "cashfree", to: "webhook", kind: "res", step: "4" },
        { from: "webhook", to: "pg", kind: "res", step: "5", label: "confirm or refund", via: [[3, 1.62], [1, 1.62]] },
        { from: "shop", to: "api", kind: "plain", via: [[0.5, 1], [0.5, 0.18]] },
        { from: "sweeps", to: "pg", kind: "async", step: "R" },
      ],
    },
    steps: [
      {
        kind: "req",
        title: "Book",
        items: [
          { n: "1", text: "The rider picks a vehicle and dates; only approved, on-licence vehicles are listed." },
          { n: "2", text: "A HOLD booking is inserted. An exclusion constraint rejects any overlap for that vehicle." },
          { n: "3", text: "The API creates a Cashfree order for the booking group." },
        ],
      },
      {
        kind: "res",
        title: "Pay",
        items: [
          { n: "4", text: "Cashfree reports the payment to the webhook, which records the event id first." },
          { n: "5", text: "A paid, live hold is confirmed. A payment that lands after the hold died is refunded." },
        ],
      },
      {
        kind: "async",
        title: "Background",
        items: [
          { n: "R", text: "**Reconcile.** Unresolved payments are checked with Cashfree, so a dropped webhook can't strand a paid rider." },
          { n: "H", text: "**Holds.** Expired holds are deleted, which frees the slot in the constraint." },
          { n: "P", text: "**Payouts.** Shop payouts are swept and transferred in stages." },
        ],
      },
    ],
    decisions: [
      {
        title: "The constraint is the referee",
        body: "Two requests can both read \"no conflict\" before either inserts, so application checks can't prevent double booking. A GiST exclusion constraint on vehicle and `tstzrange(pickup, return)` makes the second insert fail instead.",
      },
      {
        title: "Webhooks are deduplicated by the database",
        body: "Cashfree can deliver an event twice. The event id is inserted before processing, and a unique violation means it was already handled. Confirmation has three callers, the webhook, the rider's status poll and a reconcile sweep, and all of them go through the same function.",
      },
      {
        title: "Expiry needs a timer, on purpose",
        body: "An index predicate can't use `now()`, so the constraint can't expire a hold by itself. A 30-second sweep deletes lapsed holds, and a group with any payment history is kept for the audit trail.",
      },
      {
        title: "One API, three route trees",
        body: "Rider, shop and admin routes are separate trees on one modular-monolith Express API, each with its own auth middleware. The rider and shop apps share one API client.",
      },
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
    diagram: {
      nodes: [
        { id: "mic", label: "Microphone", sub: "one owner", at: [0, 0] },
        { id: "wake", label: "wake.py", sub: "OpenWakeWord · VAD", at: [1, 0], tone: "req" },
        { id: "whisper", label: "Whisper.cpp", sub: "local server", at: [2, 0], tone: "req" },
        { id: "ollama", label: "Ollama", sub: "llama3.2:3b", at: [3, 0], tone: "res" },
        { id: "kokoro", label: "Kokoro", sub: "streamed speech", at: [4, 0], tone: "res" },
        { id: "speaker", label: "Speaker", sub: "music ducked", at: [4, 1], tone: "res" },
        { id: "tools", label: "Tools", sub: "volume · apps · music", at: [3, 1], tone: "async", dashed: true },
      ],
      edges: [
        { from: "mic", to: "wake", kind: "req", step: "1" },
        { from: "wake", to: "whisper", kind: "req", step: "2" },
        { from: "whisper", to: "ollama", kind: "req", step: "3" },
        { from: "ollama", to: "kokoro", kind: "res", step: "4" },
        { from: "kokoro", to: "speaker", kind: "res", step: "5" },
        { from: "ollama", to: "tools", kind: "async", step: "T", label: "≤ 3 rounds" },
        { from: "wake", to: "kokoro", kind: "async", step: "I", label: "wake word while speaking: stop", via: [[1, -0.62], [4, -0.62]] },
      ],
    },
    steps: [
      {
        kind: "req",
        title: "Listen",
        items: [
          { n: "1", text: "A Python process owns the microphone and listens for the wake word." },
          { n: "2", text: "After a chime, Silero VAD records until silence and hands over a WAV path." },
          { n: "3", text: "A local Whisper.cpp server transcribes it." },
        ],
      },
      {
        kind: "res",
        title: "Reply",
        items: [
          { n: "4", text: "Llama 3.2 3B streams tokens; Kokoro speaks sentence by sentence as they arrive." },
          { n: "5", text: "Music is ducked while it talks, then a 5-second follow-up window opens." },
        ],
      },
      {
        kind: "async",
        title: "Control",
        items: [
          { n: "T", text: "**Tools.** Volume, apps, music and the clipboard, up to three tool rounds per reply." },
          { n: "I", text: "**Interrupt.** The wake word mid-reply stops speech and aborts the model." },
          { n: "M", text: "**Memory.** Past 30 messages, older turns are summarised and the last 10 kept." },
        ],
      },
    ],
    decisions: [
      {
        title: "One process owns the microphone",
        body: "Wake word, speech detection and recording live in one Python process that talks to Node over stdin and stdout as JSON lines. Node can mute or unmute it, but never opens the microphone itself, so two readers never fight over the device.",
      },
      {
        title: "Speech starts before the reply ends",
        body: "Model tokens are fed into a sentence splitter and Kokoro synthesises each sentence as soon as it is complete, so the first audio plays while the model is still writing.",
      },
      {
        title: "Small model, bounded context",
        body: "A 3B model with a 2,048-token context and a 120-token reply cap. Instead of growing the window, older turns are summarised into a single system message.",
      },
      {
        title: "Nothing leaves the machine",
        body: "Transcription, the model and speech synthesis all run locally. The model is kept loaded and warmed up at start, so the first reply doesn't pay the load time.",
      },
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
    diagram: {
      nodes: [
        { id: "client", label: "Client", sub: "API key", at: [0, 0] },
        { id: "api", label: "Express API", sub: "send · domains", at: [1, 0], tone: "req" },
        { id: "queue", label: "BullMQ", sub: "Redis · 5 attempts", at: [2, 0], tone: "req" },
        { id: "worker", label: "Worker", sub: "MIME · DKIM sign", at: [3, 0], tone: "req" },
        { id: "dns", label: "DNS", sub: "MX records", at: [4, 0], tone: "req" },
        { id: "pg", label: "PostgreSQL", sub: "verified domains", at: [2, 1] },
        { id: "mx", label: "Recipient MX", sub: "TCP :25", at: [4, 1], tone: "req" },
      ],
      edges: [
        { from: "client", to: "api", kind: "req", step: "1" },
        { from: "api", to: "queue", kind: "req", step: "2" },
        { from: "queue", to: "worker", kind: "req", step: "3" },
        { from: "worker", to: "pg", kind: "req", step: "4", via: [[2.86, 1]] },
        { from: "worker", to: "dns", kind: "req", step: "5" },
        { from: "dns", to: "mx", kind: "req", step: "6", label: "lowest priority first" },
        { from: "mx", to: "worker", kind: "res", step: "7", label: "reply code", via: [[3.14, 1]] },
        { from: "worker", to: "queue", kind: "async", step: "T", label: "4xx: retry with backoff", via: [[3, -0.62], [2, -0.62]] },
      ],
    },
    steps: [
      {
        kind: "req",
        title: "Queue",
        items: [
          { n: "1", text: "A client sends with an API key: `POST /email/send/one` or to a list." },
          { n: "2", text: "The API enqueues a job: 5 attempts, exponential backoff from 5 seconds." },
          { n: "3", text: "A BullMQ worker picks it up." },
        ],
      },
      {
        kind: "req",
        title: "Deliver",
        items: [
          { n: "4", text: "The sender's domain must be verified and have a DKIM key, or the job fails for good." },
          { n: "5", text: "MX records are resolved and sorted by priority." },
          { n: "6", text: "Port 25, `EHLO`, `STARTTLS` when offered, then `MAIL`, `RCPT` and `DATA`." },
          { n: "7", text: "Every reply code is classified as success, temporary or permanent." },
        ],
      },
      {
        kind: "async",
        title: "Failure",
        items: [
          { n: "T", text: "**Temporary.** 4xx, timeouts and TLS failures are thrown back to BullMQ to retry." },
          { n: "P", text: "**Permanent.** 5xx, no MX or a null MX become `UnrecoverableError`: no retries." },
          { n: "D", text: "**Domains.** SPF, DKIM and DMARC are checked in DNS before a domain can send." },
        ],
      },
    ],
    decisions: [
      {
        title: "Two kinds of failure",
        body: "`SMTPError` carries a kind, temporary or permanent. The worker rethrows temporary errors so BullMQ backs off and retries, and wraps everything else in `UnrecoverableError`, so a mailbox that doesn't exist is never hammered five times.",
      },
      {
        title: "Fall through MX hosts, stop on a hard no",
        body: "Hosts are tried in priority order. A temporary failure moves on to the next host; a permanent one ends delivery immediately, because another host for the same domain will give the same answer.",
      },
      {
        title: "No mail library",
        body: "The SMTP session, the TLS upgrade, MIME building and DKIM signing are written directly on TCP and TLS sockets, which is the point of the project.",
      },
    ],
    api: ["POST /email/send/one", "POST /email/send/list", "POST /domain/create", "POST /domain/verify", "POST /domain/verify-auth", "DELETE /domain/delete"],
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
    diagram: {
      nodes: [
        { id: "a", label: "Browser A", sub: "React board", at: [0, 0] },
        { id: "api", label: "Express API", sub: "role check", at: [1, 0], tone: "req" },
        { id: "pg", label: "PostgreSQL", sub: "org → issue", at: [2, 0], tone: "req" },
        { id: "ws", label: "WebSocket", sub: "rooms per board", at: [1, 1], tone: "res" },
        { id: "b", label: "Browser B", sub: "same board", at: [2, 1], tone: "res" },
      ],
      edges: [
        { from: "a", to: "api", kind: "req", step: "1" },
        { from: "api", to: "pg", kind: "req", step: "2" },
        { from: "api", to: "ws", kind: "res", step: "3" },
        { from: "ws", to: "b", kind: "res", step: "4" },
        { from: "b", to: "api", kind: "res", step: "5", label: "refetch", via: [[2, 0.5], [1.18, 0.5]] },
      ],
    },
    steps: [
      {
        kind: "req",
        title: "Write",
        items: [
          { n: "1", text: "A member moves an issue on the board." },
          { n: "2", text: "The API checks their role in the owning organisation and commits the change." },
        ],
      },
      {
        kind: "res",
        title: "Fan-out",
        items: [
          { n: "3", text: "After the commit, an event like `issue:moved` is broadcast to the board's room." },
          { n: "4", text: "Every socket in that room receives it, naming the sections that changed." },
          { n: "5", text: "Each client refetches only those sections." },
        ],
      },
      {
        kind: "async",
        title: "Rooms",
        items: [
          { n: "J", text: "**Join.** A socket joins an organisation or board room only after a membership check in the database." },
          { n: "C", text: "**Reconnect.** The client reconnects with backoff and rejoins the rooms it wants." },
        ],
      },
    ],
    decisions: [
      {
        title: "Events say what changed, not the new state",
        body: "A broadcast carries an event name and the affected section ids, nothing more. Clients refetch through the same authorised REST routes, so the socket never becomes a second data path with its own permission rules.",
      },
      {
        title: "One source of permissions",
        body: "Every route derives access from the user's role in the organisation that owns the board. Admin-only actions check for the admin role on the row, not in the client.",
      },
      {
        title: "Broadcast after commit",
        body: "Writes run in a transaction and the event is sent only after `COMMIT`, so a client never refetches state that was rolled back.",
      },
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
    diagram: {
      nodes: [
        { id: "o", label: "Player O", sub: "React", at: [0, 0] },
        { id: "server", label: "Room server", sub: "Node · ws", at: [1.4, 0], tone: "req" },
        { id: "x", label: "Player X", sub: "React", at: [2.8, 0] },
      ],
      edges: [
        { from: "o", to: "server", kind: "req", step: "1", label: "move", lane: -9 },
        { from: "server", to: "o", kind: "res", step: "3", lane: 9 },
        { from: "x", to: "server", kind: "req", step: "J", label: "join", lane: -9 },
        { from: "server", to: "x", kind: "res", step: "4", lane: 9 },
      ],
    },
    steps: [
      {
        kind: "req",
        title: "Room",
        items: [
          { n: "J", text: "One player creates a room and gets a code; the second joins with it. A full room refuses a third." },
          { n: "1", text: "A player sends the cell they chose." },
        ],
      },
      {
        kind: "res",
        title: "Move",
        items: [
          { n: "2", text: "The server rejects a filled cell, a move out of turn, or any move after the game ends." },
          { n: "3", text: "Valid moves flip the turn and the new board goes to both players." },
          { n: "4", text: "The other player gets the same board and whose turn it is." },
        ],
      },
      {
        kind: "async",
        title: "Result",
        items: [
          { n: "W", text: "**Win.** Rows, columns and both diagonals are checked for the room's board size, 3×3 to 8×8." },
          { n: "D", text: "**Draw.** A full board with no line is a draw; both players get `game_over`." },
        ],
      },
    ],
    decisions: [
      {
        title: "The server owns the board",
        body: "Clients only send a cell index. The room's board, whose turn it is and the winner live on the server, which validates every move before anyone sees it.",
      },
      {
        title: "Win detection for any size",
        body: "The check walks every row, column and both diagonals for an n×n board, so the same code runs 3×3 and 8×8.",
      },
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

