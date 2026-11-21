# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Bun + React 19 + GSAP (ScrollTrigger). The repository already contains a `bun-react-template`
scaffold; this build extends it rather than replacing it. Chosen by the user. The chat endpoint
runs on the same `Bun.serve` process, so the deployed site needs a Bun/Node host rather than
pure static hosting.

## Users

Primary: engineering recruiters and hiring engineers evaluating Manas Kushwaha for full-stack
roles (web, mobile, applied AI),. They arrive from a LinkedIn or GitHub
link, usually on desktop, usually skimming, and they are deciding within about thirty seconds
whether this person builds real systems or assembles tutorials.

Secondary: other developers who found him through his technical posts and want to see the
projects behind them.

## Product Purpose

A single personal site that replaces "here is my GitHub" as the thing Manas sends people.
Success is a reader who can name what he built and why it was hard, and who has his email.

## Positioning

The differentiator is not a technology list. It is that he learns infrastructure by building
the system itself: a matching engine rather than a CRUD API, an offline voice pipeline rather
than an API wrapper, a hand-written tool-calling loop rather than a framework. The site has to
make that pattern legible, because it is the thing a competing student portfolio cannot copy.

## Operating Context

Read in a browser tab, often alongside the GitHub profile, frequently as one of many tabs in a
screening session. Shared as a URL in applications and DMs. Must survive being opened on a
phone.

## Capabilities and Constraints

- Single scrolling page plus one detail page per project, client-routed, each reachable by
  direct URL.
- `POST /api/chat` proxies to the Gemini API. The key is server-side only; `BUN_PUBLIC_*`
  values are compiled into the client bundle and can never hold a secret.
- Everything optional is env-driven: contact links, availability line, competitive-programming
  line, chat agent, music player. An unset link variable hides its row.
- Background music is on by default (user decision, Nov 2026): it starts on the visitor's first
  click, tap or key press (browsers block sound before that), plays at 30% volume, fades out as
  the hero leaves, and has a nav toggle to stop it; a mute is remembered.
- Hero video asset is derived from the user's own `Timeline Video.mp4`.

## Brand Commitments

- Name: Manas Kushwaha. Contact: manaskushwaha123@gmail.com.
- The silhouette video is his own work and is the site's signature image.
- Visual direction is pinned by the user (Nov 2026, replacing the earlier near-black/olive
  build): light "lab paper" ground at exactly #f3f3f3 (the hero video's own background, so
  the head sits edgeless with `darken`), soft rounded cards, two-tone Archivo headlines
  (ink + grey), Azeret Mono labels, one signal-blue accent for the hero's annotation frame,
  lime only as the contact grid's cursor light. References: Kodor/Monotime tall cards,
  Sensorium grid-lined card, koi annotation diagram, glossy black pill CTA.
- Voice: plain and technical. No agency language, no "crafting digital experiences".

## Evidence on Hand

Real and usable:

- Internship at Ascendlink Technologies (Jun–Jul 2026, remote): dashboard queries 5.6s → ~200ms;
  ClickHouse 2s → 780ms and 550ms → 400ms; proxy-based Google Ads and Meta Ads APIs behind one
  interface; a BFF layer.
- `manas987/Centralized-Exchange` — seven services, Kafka order flow, Redis pub/sub, Postgres +
  TimescaleDB, WebSocket streaming, Docker Compose, FIFO price-time-priority matching, partial
  fills, snapshot and replay recovery.
- `manas987/Local_AI_Assistant` (Bella) — OpenWakeWord, Silero VAD, Whisper.cpp, Ollama/Qwen3,
  Kokoro; Python audio engine owns the microphone, Node orchestrates.
- `manas987/AI-agent-harness` — Bun, TypeScript, hand-written tool-calling loop.
- `manas987/Chat-app` — React/Vite + Express + `ws` + MongoDB + JWT/bcrypt, deployed.
- `manas987/Life-OS` — React 19, Vite 7, Tailwind, shadcn/ui, Recharts, 59 commits, deployed.
- Codeforces `memyself` — Pupil, 1258 current / 1267 max, 508 solved, 18 rated contests.
- Asset: `Timeline Video.mp4`, a double-exposure silhouette, 12.36s.

- `manas987/Resort-Booking` — internship trial: direct booking for a 76-key resort (64 rooms,
  12 villas), oversell-proof under concurrency, Gemini enquiry routing; 28 tables, 30 guest +
  55 staff endpoints. Payments and messaging mocked; no public deployment.
- `manas987/RetroMobi` — scooter rental marketplace: web app plus rider and shop Expo apps on
  one backend. Mobile apps checked and run on an Android emulator only; no real-device or
  native payment test, no store release.
- Re-verified Nov 2026 from the repos: Bella (README "Jarlvis") now ships macOS tools and
  model-summarised conversation memory, on Llama 3.2 3B; the SMTP repo now contains the real
  engine (MX, STARTTLS, DKIM, MIME, BullMQ retries, SPF/DKIM/DMARC checks).

Must not be fabricated or overstated: the exchange is an engineering build and a simulation of
exchange infrastructure, never "production". Bella's multi-step reasoning is planned, not
shipped. No benchmarks exist for the exchange's latency.
No testimonials, no employers beyond Ascendlink, no open-source adoption numbers.

Deliberately undecided: the music track (user will supply), the final hero headline.

## Product Principles

1. **Every claim is checkable.** If a number is on the page it came from the profile docs, and
   if a project is on the page its repository is linked.
2. **Show the system, not the stack.** A list of technologies is what every student portfolio
   has; the architecture and the specific hard problem are what he actually has.
3. **Honest about stage.** Student, early, building. Overclaiming is the fastest way to lose
   the reader this site is for.
4. **The work outranks the interface.** Expression serves the artifact and the projects; when
   they compete, the projects win.
5. **Nothing optional is load-bearing.** Chat, music and every link can be switched off by env
   without the page breaking or looking unfinished.

## Accessibility & Inclusion

`prefers-reduced-motion` must disable the scroll choreography and pins rather than merely
shortening them. Audio starts only after a user gesture, and the nav toggle stops it. All contrast holds against the
near-black ground at the 4.5:1 floor for body text.
