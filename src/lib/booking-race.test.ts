import { expect, test } from "bun:test";
import { runRace } from "./booking-race";

test("with the lock, exactly one guest gets the last room", () => {
  const { events, committed } = runRace(1, true);
  expect(committed).toBe(1);
  expect(events.filter((e) => e.outcome).map((e) => [e.guest, e.outcome])).toEqual([
    ["A", "booked"],
    ["B", "refused"],
  ]);
});

test("without it, both read 'free' and the room is sold twice", () => {
  expect(runRace(1, false).committed).toBe(2);
});
