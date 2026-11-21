/**
 * The exchange's match loop, ported from Centralized-Exchange
 * (Backend/services/matching-service/src/maching_engine.ts) to run in the browser.
 *
 * Same rules as the engine: price-time priority, fills at the resting (maker) price, a limit
 * remainder rests on the book, a market remainder is dropped. The engine keeps each side in a
 * js-sdsl OrderedMap<price, Order[]>; here a sorted array of levels plays that role, with the
 * same front()/back() reads (best ask = first, best bid = last).
 */

export type Side = "BUY" | "SELL";
export type OrderType = "LIMIT" | "MARKET";

export type Order = {
  id: number;
  side: Side;
  type: OrderType;
  price: number;
  quantity: number;
  filled: number;
};

export type Trade = { id: number; price: number; quantity: number; taker: Side };

type Level = [price: number, orders: Order[]];

export type Book = { bids: Level[]; asks: Level[]; nextId: number };

const remaining = (o: Order) => o.quantity - o.filled;

function insertLevel(levels: Level[], order: Order) {
  let i = levels.findIndex(([price]) => price >= order.price);
  if (i === -1) i = levels.length;
  if (levels[i]?.[0] === order.price) levels[i]![1].push(order);
  else levels.splice(i, 0, [order.price, [order]]);
}

/** One loop covers the engine's four match functions; they differ only in which side they
 *  walk, which end is best, and whether a price limit applies. */
export function match(book: Book, input: Omit<Order, "id" | "filled">): Trade[] {
  const order: Order = { ...input, id: book.nextId++, filled: 0 };
  const buying = order.side === "BUY";
  const opposite = buying ? book.asks : book.bids;
  const trades: Trade[] = [];

  while (remaining(order) > 0) {
    const best = buying ? opposite[0] : opposite[opposite.length - 1];
    if (!best) break;
    const [price, queue] = best;
    if (order.type === "LIMIT" && (buying ? order.price < price : order.price > price)) break;

    const maker = queue[0]!;
    const amount = Math.min(remaining(order), remaining(maker));
    order.filled += amount;
    maker.filled += amount;
    trades.push({ id: book.nextId++, price, quantity: amount, taker: order.side });

    if (remaining(maker) === 0) queue.shift();
    if (queue.length === 0) opposite.splice(opposite.indexOf(best), 1);
  }

  if (order.type === "LIMIT" && remaining(order) > 0) {
    insertLevel(buying ? book.bids : book.asks, order);
  }
  return trades;
}

/** Price, total remaining size and order count per level, best first. */
export function depth(levels: Level[], side: Side) {
  const rows = levels.map(([price, orders]) => ({
    price,
    size: orders.reduce((sum, o) => sum + remaining(o), 0),
    count: orders.length,
  }));
  return side === "BUY" ? rows.reverse() : rows;
}

export function seedBook(): Book {
  const book: Book = { bids: [], asks: [], nextId: 1 };
  const seed: [Side, number, number][] = [
    ["SELL", 103, 30], ["SELL", 102.5, 22], ["SELL", 102, 10], ["SELL", 101.5, 15],
    ["SELL", 101, 8], ["SELL", 101, 6],
    ["BUY", 99.5, 9], ["BUY", 99, 12], ["BUY", 99, 7], ["BUY", 98.5, 20],
    ["BUY", 98, 26], ["BUY", 97.5, 35],
  ];
  for (const [side, price, quantity] of seed) match(book, { side, type: "LIMIT", price, quantity });
  return book;
}
