import { test, equal } from "@elements/app";
import { statusLabel, statusPill, isStatus } from "#app/shared/services/status";
import { timeAgo, plural, initials } from "#app/shared/services/format";

test("display helpers", () => {
  test("statuses have labels and pills", () => {
    equal(statusLabel("in_progress"), "In progress");
    equal(statusPill("shipped"), "is-success");
    equal(isStatus("planned"), true);
    equal(isStatus("someday"), false);
  });

  test("relative times, counts and initials", () => {
    let now = new Date("2026-09-30T12:00:00Z");

    equal(timeAgo(new Date("2026-09-30T11:59:30Z"), now), "just now");
    equal(timeAgo(new Date("2026-09-30T09:00:00Z"), now), "3h ago");
    equal(timeAgo(new Date("2026-09-20T12:00:00Z"), now), "1w ago");
    equal(plural(1, "comment"), "1 comment");
    equal(plural(3, "comment"), "3 comments");
    equal(initials("Maya Okafor"), "MO");
  });
});
