import { useEffect, useRef, useState } from "react";
import { config } from "../config";
import { ArrowUp, Close, Message } from "../lib/icons";

type Turn = { role: "user" | "model"; text: string };

const SUGGESTIONS = [
  "What was hardest about the exchange?",
  "Does he know Kafka?",
  "What should I ask him in an interview?",
];

export function Chat() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input, [href]",
      );
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [turns]);

  if (!config.chat.enabled) return null;

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;

    const history = [...turns, { role: "user" as const, text: question }];
    setTurns([...history, { role: "model", text: "" }]);
    setDraft("");
    setBusy(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ turns: history }),
      });

      if (!response.ok) {
        // The server already writes a readable sentence for every failure it owns
        // (unconfigured, rate-limited, upstream down). Show that rather than a generic.
        const reason = (await response.text().catch(() => "")).trim();
        setTurns([
          ...history,
          { role: "model", text: reason || "That request did not go through." },
        ]);
        return;
      }
      if (!response.body) throw new Error("no body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setTurns([...history, { role: "model", text: answer }]);
      }

      if (!answer.trim()) {
        setTurns([
          ...history,
          { role: "model", text: "I did not get an answer back. Try again?" },
        ]);
      }
    } catch {
      setTurns([
        ...history,
        {
          role: "model",
          text: "Something went wrong reaching the model. Manas is at " +
            (config.email || "his email") + " if it keeps failing.",
        },
      ]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  return (
    <>
      <button
        type="button"
        className="chat-bubble"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? "Close the portfolio agent" : "Ask about this work"}
      >
        {open ? <Close size={17} /> : <Message size={19} />}
      </button>

      <div
        id="chat-panel"
        className="chat-panel"
        data-open={open}
        role="dialog"
        aria-label={`${config.chat.name}, portfolio agent`}
        aria-modal="false"
        ref={panelRef}
        inert={!open}
      >
        <div className="chat-head">
          <span className="chat-status" aria-hidden />
          <p className="chat-name">{config.chat.name}</p>
          <p className="chat-role">portfolio agent</p>
          <button
            type="button"
            className="chat-close"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <Close size={14} />
          </button>
        </div>

        <div className="chat-log" ref={logRef}>
          {turns.length === 0 ? (
            <div className="chat-empty">
              <p className="body-copy">
                Ask about the projects, the stack, or what Manas actually did.
                Answers come from his own notes.
              </p>
              <div className="chat-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="chat-suggestion"
                    onClick={() => void send(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            turns.map((turn, i) => (
              <div key={i} className="chat-turn" data-role={turn.role}>
                {turn.text ||
                  (busy && i === turns.length - 1 ? (
                    <span className="chat-typing" aria-label="Thinking">
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : null)}
              </div>
            ))
          )}
        </div>

        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={turns.length ? "Ask a follow-up..." : "Ask anything..."}
            aria-label="Message"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            aria-label="Send"
          >
            <ArrowUp size={14} />
          </button>
        </form>
      </div>
    </>
  );
}
