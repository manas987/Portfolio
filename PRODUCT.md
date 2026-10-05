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

Primary: engineering recruiters and hiring engineers evaluating Manas Kushwaha for backend,
distributed-systems and AI-infrastructure internships. They arrive from a LinkedIn or GitHub
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
- Background music is scoped to the hero only and fades out as the hero leaves. It never
  autoplays.
- Hero video asset is derived from the user's own `Timeline Video.mp4`.

## Brand Commitments

- Name: Manas Kushwaha. Contact: manaskushwaha123@gmail.com.
- The silhouette video is his own work and is the site's signature image.
- Visual direction is pinned by the user: near-black ground, olive/lime accent, editorial
  display type with an italic accent, data set in mono, a section-progress counter. Derived
  from a manus-built prototype he approved.
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

Must not be fabricated or overstated: the exchange is an engineering build and a simulation of
exchange infrastructure, never "production". Bella's memory, tools and desktop control are
planned, not shipped. The SMTP repository is a Turborepo starter; the completed SMTP engine is
a personal claim, not verifiable from the repo. No benchmarks exist for the exchange's latency.
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
shortening them. Audio never starts without a user gesture. All contrast holds against the
near-black ground at the 4.5:1 floor for body text.
