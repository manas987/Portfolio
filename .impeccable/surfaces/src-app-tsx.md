---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/index.html","src/index.css"]
---

Scope: the portfolio site at `src/` — one scrolling page (hero, about, selected work,
experience, contact) plus a detail page per project at `/work/<slug>`. Visitor mode:
Experience, with Persuade pressure on the contact close.

Audience: engineering recruiters and hiring engineers screening Manas for backend /
distributed-systems internships, skimming on desktop, deciding in ~30 seconds. Job: establish
that he builds real systems. Action: email him. Proof: the Ascendlink latency numbers, the
seven-service exchange, the offline voice pipeline, every repo linked.

Constraints: all optional surfaces (links, availability, chat agent, music) are env-gated and
must degrade invisibly. Music is hero-scoped and never autoplays. Deploys to Vercel: static
bundle plus one serverless function for the chat endpoint.

Memorable moment: the inverted, screen-blended silhouette head floating edgeless on the black
ground, drifting and dissolving as the hero scrolls away while the music fades with it.

Unresolved: music track (user supplying), final hero headline wording.

## Direction contract

THESIS: A record of systems, not a presentation of a person. The page refuses the student-
portfolio arrangement — avatar, skills grid, same-size project cards — and instead reads as an
instrument panel for a body of work: the artifact floating in the dark at the top, then the
work itself in full-width rows that open rather than tile. The one idea it owns is that each
project is introduced by its hardest problem, not by its stack.

OWN-WORLD: Near-black ground (#0A0A09) with a warm olive-lime (#B8D22A) as the single
committed accent, taken to region scale in the contact close rather than sprinkled as link
colour. Archivo for structure and display, Bodoni Moda italic for exactly one emphasised word
per headline, Azeret Mono reserved for genuine data — latencies, counts, years, stack lines,
the scroll-position readout — never as a decorative label font. Hairline rules at 1px in a
warm grey, no cards, no borders that are not structural. Authored SVG icons in one stroke
weight; no unicode arrows. Recognizable with all content removed by: the floating edgeless
head, the olive field, and the fixed mono progress rail down the right edge.

STORY: The visitor understands within one viewport that this is an engineer with an actual
artifact and a point of view. They come to believe it by reading specifics they could verify —
5.6s to 200ms, FIFO price-time priority, a Python process that owns the microphone. They email
him, or they open a repository.

FIRST VIEWPORT: Full-bleed black. The silhouette video sits right of centre, roughly 46% of
the viewport width, inverted and screen-blended so it has no edges and no frame, bleeding past
the right margin and fading into the ground at its base. Headline set left at the optical
third, two lines of Archivo at clamp(3rem, 7vw, 6rem) with one word in Bodoni Moda italic.
Below it, two lines of plain body copy at 65ch max, then the primary action — a text link to
the work section with an authored arrow, underlined on an offset. Top rail: wordmark left,
three nav links centre, olive availability dot right. Bottom rail: the music player at left,
set small and quiet, and the mono scroll-position readout fixed at the right edge. No eyebrow
label above the headline, no kicker, no scroll hint competing with the primary action.

FORM: Pinned by the user from an approved manus-built prototype — near-black editorial with
mono data, an italic display accent, and a section-progress counter. Ranked first and only;
the brief pins it, so the roll is not run. No seed key: user-pinned direction, concept-seed
not applicable.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the
verdict, DESIGN.md, and every shipping raster carrying its provenance.
