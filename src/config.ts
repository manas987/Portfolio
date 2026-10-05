/**
 * Every read below must be a literal `process.env.BUN_PUBLIC_X`. The bundler substitutes
 * these at build time by matching the source text, so a dynamic `process.env[key]` lookup
 * silently resolves to undefined in the browser.
 */

const text = (value: string | undefined) => (value ?? "").trim();
const flag = (value: string | undefined, fallback: boolean) => {
  const raw = text(value).toLowerCase();
  if (!raw) return fallback;
  return raw !== "false" && raw !== "0" && raw !== "off";
};

const email = text(process.env.BUN_PUBLIC_EMAIL);

export type ContactLink = { label: string; href: string };

const links: ContactLink[] = (
  [
    ["GitHub", text(process.env.BUN_PUBLIC_GITHUB_URL)],
    ["LinkedIn", text(process.env.BUN_PUBLIC_LINKEDIN_URL)],
    ["X", text(process.env.BUN_PUBLIC_X_URL)],
    ["Codeforces", text(process.env.BUN_PUBLIC_CODEFORCES_URL)],
  ] as const
)
  .filter(([, href]) => Boolean(href))
  .map(([label, href]) => ({ label, href }));

export const config = {
  email,
  links,
  availability: text(process.env.BUN_PUBLIC_AVAILABILITY),
  showCp: flag(process.env.BUN_PUBLIC_SHOW_CP, true),
  chat: {
    enabled: flag(process.env.BUN_PUBLIC_SHOW_CHAT, true),
    name: text(process.env.BUN_PUBLIC_CHAT_AGENT_NAME) || "Manas 1.0",
  },
  music: {
    enabled: flag(process.env.BUN_PUBLIC_SHOW_MUSIC, true),
    src: text(process.env.BUN_PUBLIC_MUSIC_SRC),
    title: text(process.env.BUN_PUBLIC_MUSIC_TITLE) || "Ambient loop",
    artist: text(process.env.BUN_PUBLIC_MUSIC_ARTIST),
  },
};
