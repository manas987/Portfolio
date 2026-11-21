import { useEffect, useRef, useState, type ReactNode } from "react";
import { runRace, type RaceEvent } from "../lib/booking-race";
import { depth, match, seedBook, type OrderType, type Side, type Trade } from "../lib/matching";

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: [T, ReactNode][];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

const fmt = (n: number) => n.toFixed(2);

export function OrderBookDemo() {
  const book = useRef(seedBook());
  const [, redraw] = useState(0);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [side, setSide] = useState<Side>("BUY");
  const [type, setType] = useState<OrderType>("LIMIT");
  const [price, setPrice] = useState("101.00");
  const [qty, setQty] = useState("12");

  const asks = depth(book.current.asks, "SELL").slice(0, 6).reverse();
  const bids = depth(book.current.bids, "BUY").slice(0, 6);
  const max = Math.max(1, ...asks.map((l) => l.size), ...bids.map((l) => l.size));
  const spread = asks.length && bids.length ? asks[asks.length - 1]!.price - bids[0]!.price : null;

  const quantity = Number(qty);
  const limit = Number(price);
  const valid = quantity > 0 && Number.isFinite(quantity) && (type === "MARKET" || (limit > 0 && Number.isFinite(limit)));

  const place = () => {
    if (!valid) return;
    const fills = match(book.current, { side, type, price: type === "LIMIT" ? limit : 0, quantity });
    setTrades((t) => [...fills.reverse(), ...t].slice(0, 14));
    redraw((n) => n + 1);
  };

  const reset = () => {
    book.current = seedBook();
    setTrades([]);
    redraw((n) => n + 1);
  };

  const row = (l: { price: number; size: number; count: number }, s: "ask" | "bid") => (
    <li key={l.price} className={`ob-row ${s}`}>
      <span className="ob-bar" style={{ width: `${(l.size / max) * 100}%` }} />
      <span>{fmt(l.price)}</span>
      <span>{l.size}</span>
      <span>{l.count}</span>
    </li>
  );

  return (
    <div className="demo ob">
      <div className="ob-book mono" aria-label="Order book">
        <div className="ob-row ob-head">
          <span>Price</span>
          <span>Size</span>
          <span>Orders</span>
        </div>
        <ul>{asks.map((l) => row(l, "ask"))}</ul>
        <p className="ob-spread">{spread === null ? "one side empty" : `spread ${fmt(spread)}`}</p>
        <ul>{bids.map((l) => row(l, "bid"))}</ul>
      </div>

      <form
        className="ob-form"
        onSubmit={(e) => {
          e.preventDefault();
          place();
        }}>
        <Segmented label="Side" value={side} onChange={setSide} options={[["BUY", "Buy"], ["SELL", "Sell"]]} />
        <Segmented label="Order type" value={type} onChange={setType} options={[["LIMIT", "Limit"], ["MARKET", "Market"]]} />
        <label className={type === "MARKET" ? "is-off" : undefined}>
          <span className="mono">Price</span>
          <input
            className="mono"
            inputMode="decimal"
            value={type === "MARKET" ? "Best available" : price}
            disabled={type === "MARKET"}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
        <label>
          <span className="mono">Quantity</span>
          <input className="mono" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
        </label>
        <button type="submit" className="demo-primary" disabled={!valid}>
          Place order
        </button>
      </form>

      <div className="ob-trades mono">
        <div className="ob-trades-head">
          <span>Trades</span>
          <button type="button" className="demo-ghost" onClick={reset}>
            Reset book
          </button>
        </div>
        <ul aria-live="polite">
          {trades.length === 0 && <li className="ob-empty">No trades yet.</li>}
          {trades.map((t) => (
            <li key={t.id} className={t.taker === "BUY" ? "bid" : "ask"}>
              <span>{t.taker === "BUY" ? "Buy" : "Sell"}</span>
              <span>{t.quantity}</span>
              <span>@ {fmt(t.price)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const STEP_MS = 700;

export function BookingRaceDemo() {
  const [locked, setLocked] = useState(true);
  const [shown, setShown] = useState<RaceEvent[]>([]);
  const [result, setResult] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => () => clearInterval(timer.current), []);

  const run = () => {
    clearInterval(timer.current);
    const { events, committed } = runRace(1, locked);
    setResult(null);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(events);
      setResult(committed);
      return;
    }
    let i = 0;
    setShown([]);
    timer.current = setInterval(() => {
      i += 1;
      setShown(events.slice(0, i));
      if (i === events.length) {
        clearInterval(timer.current);
        setResult(committed);
      }
    }, STEP_MS);
  };

  return (
    <div className="demo race">
      <div className="race-controls">
        <Segmented
          label="Booking path"
          value={locked ? "lock" : "nolock"}
          onChange={(v) => {
            setLocked(v === "lock");
            setShown([]);
            setResult(null);
          }}
          options={[["lock", "With the lock"], ["nolock", "Without it"]]}
        />
        <button type="button" className="demo-primary" onClick={run}>
          Both guests book the last room
        </button>
      </div>

      <div className="race-lanes">
        {(["A", "B"] as const).map((g) => (
          <div key={g} className="race-lane">
            <p className="mono">Guest {g}</p>
            <ol>
              {shown.map((e, i) =>
                e.guest === g ? (
                  <li key={i} className={e.outcome ? `race-${e.outcome}` : undefined} style={{ gridRow: i + 1 }}>
                    {e.text}
                  </li>
                ) : null,
              )}
            </ol>
          </div>
        ))}
      </div>

      <p className="race-result" aria-live="polite" data-bad={result !== null && result > 1 ? true : undefined}>
        {result === null
          ? "One room left. Two guests press book at the same moment."
          : result > 1
            ? `Sold ${result} of 1 room. Without the lock, both read "free" before either wrote.`
            : `Sold ${result} of 1 room. The second guest rechecked under the lock and was refused.`}
      </p>
    </div>
  );
}
