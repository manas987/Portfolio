/**
 * A step-by-step model of two guests booking the last room at the same moment, following
 * Resort-Booking's createBookingHold (apps/Backend/src/core/booking.ts + inventory.ts):
 * lock the room-night rows FOR UPDATE in a fixed order, recheck availability while the lock
 * is held, then insert every night or none. With `locked` off it shows the read-then-write
 * race that the lock exists to prevent.
 */

export type Guest = "A" | "B";
export type RaceEvent = { guest: Guest; text: string; outcome?: "booked" | "refused" };

export function runRace(allotment: number, locked: boolean) {
  let committed = 0;
  const events: RaceEvent[] = [];
  const say = (guest: Guest, text: string, outcome?: RaceEvent["outcome"]) =>
    events.push({ guest, text, outcome });

  const book = (guest: Guest, seen: number) => {
    if (seen + 1 > allotment) return say(guest, `Sees ${seen}/${allotment} taken. Refused`, "refused");
    committed += 1;
    say(guest, "Inserts the night and commits", "booked");
  };

  if (locked) {
    say("A", "Locks room_day FOR UPDATE");
    say("B", "Asks for the same lock, waits");
    say("A", `Rechecks: ${committed}/${allotment} taken`);
    book("A", committed);
    say("B", "Gets the lock after A commits");
    say("B", `Rechecks: ${committed}/${allotment} taken`);
    book("B", committed);
  } else {
    // Both read before either writes, so both see the room as free.
    const seenByA = committed;
    say("A", `Reads availability: ${seenByA}/${allotment} taken`);
    const seenByB = committed;
    say("B", `Reads availability: ${seenByB}/${allotment} taken`);
    book("A", seenByA);
    book("B", seenByB);
  }

  return { events, committed };
}
