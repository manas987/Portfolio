# Portfolio

Manas Kushwaha's portfolio. Bun + React + GSAP, one scrolling page plus a detail page per
project, a Gemini-backed chat agent, and a hero-scoped music player.

```bash
bun install
cp .env.example .env    # then fill in GEMINI_API_KEY
bun dev                 # http://localhost:3000
bun run build           # static bundle + public assets into dist/
```

## Configuration

Everything optional is driven by `.env` — see `.env.example` for the full list. Two rules:

- `BUN_PUBLIC_*` values are compiled into the browser bundle. Never put a secret in one.
- An empty link variable hides that link. Empty `BUN_PUBLIC_AVAILABILITY` hides the nav dot;
  empty `BUN_PUBLIC_MUSIC_SRC` hides the player; `BUN_PUBLIC_SHOW_CHAT=false` removes the
  chat agent.

In `src/config.ts` every read must stay a literal `process.env.BUN_PUBLIC_X`. The bundler
substitutes these by matching source text, so a dynamic `process.env[key]` lookup silently
resolves to undefined in the browser.

## Content

All copy and project data lives in `src/content.ts`. Editing it never requires touching a
component. The chat agent's system prompt is built from the same file, so the page and the
agent cannot drift apart.

`PRODUCT.md` records what may and may not be claimed — the exchange is an engineering build
and not production, Bella's memory and tool use are planned rather than shipped, and no
latency benchmarks exist. Keep new copy inside those bounds.

## Assets

`public/hero.webm` and `public/hero.mp4` are derived from `Timeline Video.mp4`:

```bash
ffmpeg -i "Timeline Video.mp4" -an -vf scale=1280:-2 -c:v libvpx-vp9 -crf 34 -b:v 0 public/hero.webm
ffmpeg -i "Timeline Video.mp4" -an -vf scale=1280:-2 -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart public/hero.mp4
```

`public/audio/track.mp3` is a silent placeholder. Replace it with the real track and clear
`BUN_PUBLIC_MUSIC_TITLE` from `.env`.

## Deploying

Vercel, configured by `vercel.json`: the static bundle from `dist/`, `/work/*` rewritten to
`index.html`, and `api/chat.ts` as an edge function. Set `GEMINI_API_KEY` (and optionally
`GEMINI_MODEL`) plus every `BUN_PUBLIC_*` value in the Vercel project's environment — the
public ones are needed at build time, not runtime.

`src/index.ts` runs the same chat handler on `Bun.serve` for local development, so the
endpoint behaves identically in both places.
