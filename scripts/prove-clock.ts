import { firstResponseDue, isOnDayQueue, nextWorkingOpen, type DayHours } from "../src/domain/clock";

const hours: DayHours[] = [
  { dayOfWeek: 0, opensAt: null, closesAt: null },
  { dayOfWeek: 1, opensAt: "09:30:00", closesAt: "18:30:00" },
  { dayOfWeek: 2, opensAt: "09:30:00", closesAt: "18:30:00" },
  { dayOfWeek: 3, opensAt: "09:30:00", closesAt: "18:30:00" },
  { dayOfWeek: 4, opensAt: "09:30:00", closesAt: "18:30:00" },
  { dayOfWeek: 5, opensAt: "09:30:00", closesAt: "18:30:00" },
  { dayOfWeek: 6, opensAt: "09:30:00", closesAt: "18:30:00" },
];

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const sundayNight = new Date("2026-08-23T21:40:00+05:30");
const open = nextWorkingOpen(sundayNight, hours, "Asia/Kolkata");
const due = firstResponseDue(sundayNight, hours, 30, "Asia/Kolkata");
console.log("Sunday 21:40 IST -> open", open.toISOString(), "due", due.toISOString());
assert(open.toISOString() === "2026-08-24T04:00:00.000Z", "open should be Monday 09:30 IST");
assert(due.toISOString() === "2026-08-24T04:30:00.000Z", "due should be Monday 10:00 IST");

const wed = new Date("2026-08-26T10:00:00+05:30");
assert(
  nextWorkingOpen(wed, hours, "Asia/Kolkata").getTime() === wed.getTime(),
  "inside hours stays put",
);

assert(
  !isOnDayQueue(
    new Date("2026-08-25T10:00:00+05:30"),
    new Date("2026-08-24T11:00:00+05:30"),
  ),
  "a due time after today stays off Today",
);
assert(
  isOnDayQueue(new Date("2026-08-24T10:00:00+05:30"), new Date("2026-08-24T11:00:00+05:30")),
  "due today is on the queue",
);

console.log("CLOCK_OK working hours gate the clock");
