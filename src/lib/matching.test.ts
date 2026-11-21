import { expect, test } from "bun:test";
import { depth, match, seedBook } from "./matching";

test("crossing limit buy fills at the maker price, FIFO within a level, remainder rests", () => {
  const book = seedBook();
  // Asks at 101: 8 then 6. Buy 20 @ 101.5 takes 8, 6, then 6 of the 15 at 101.5.
  const trades = match(book, { side: "BUY", type: "LIMIT", price: 101.5, quantity: 20 });
  expect(trades.map((t) => [t.price, t.quantity])).toEqual([[101, 8], [101, 6], [101.5, 6]]);
  expect(depth(book.asks, "SELL")[0]).toEqual({ price: 101.5, size: 9, count: 1 });
});

test("limit remainder rests on its own side", () => {
  const book = seedBook();
  const trades = match(book, { side: "BUY", type: "LIMIT", price: 101, quantity: 20 });
  expect(trades.reduce((s, t) => s + t.quantity, 0)).toBe(14);
  expect(depth(book.bids, "BUY")[0]).toEqual({ price: 101, size: 6, count: 1 });
});

test("non-crossing limit just rests", () => {
  const book = seedBook();
  expect(match(book, { side: "SELL", type: "LIMIT", price: 100, quantity: 5 })).toEqual([]);
  expect(depth(book.asks, "SELL")[0]).toEqual({ price: 100, size: 5, count: 1 });
});

test("market sell walks the bids and drops what it cannot fill", () => {
  const book = seedBook();
  const trades = match(book, { side: "SELL", type: "MARKET", price: 0, quantity: 500 });
  expect(trades.reduce((s, t) => s + t.quantity, 0)).toBe(109);
  expect(book.bids).toEqual([]);
  expect(book.asks.length).toBe(5); // nothing rested
});
