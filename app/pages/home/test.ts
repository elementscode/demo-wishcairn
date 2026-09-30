import { test, equal } from "@elements/app";
import { FeatureRequest } from "#app/shared/services/board";
import { visibleRequests, countFor } from "./template";

function row(title: string, status: FeatureRequest["status"], voteCount: number, daysAgo: number, extra: Partial<FeatureRequest> = {}): FeatureRequest {
  let createdAt = new Date(Date.now() - daysAgo * 86_400_000);

  return {
    id: title,
    createdAt,
    updatedAt: createdAt,
    statusChangedAt: createdAt,
    title,
    description: `${title} description`,
    status,
    authorId: "a",
    authorName: "Ada",
    voteCount,
    commentCount: 0,
    mergedIntoId: null,
    ...extra,
  };
}

let rows = [
  row("Dark mode", "under_review", 3, 1),
  row("CSV export", "planned", 9, 10),
  row("Video calls", "closed", 12, 30),
  row("Dark theme", "closed", 0, 0, { mergedIntoId: "Dark mode" }),
  row("Recurring tasks", "shipped", 3, 5),
];

test("board", () => {
  test("top ranks by votes and hides closed and merged requests", () => {
    let titles = visibleRequests(rows, { sort: "top", query: "", status: "open" }).map((r) => r.title);

    equal(titles, ["CSV export", "Dark mode", "Recurring tasks"]);
  });

  test("new ranks newest first", () => {
    let titles = visibleRequests(rows, { sort: "new", query: "", status: "all" }).map((r) => r.title);

    equal(titles, ["Dark mode", "Recurring tasks", "CSV export", "Video calls"]);
  });

  test("search matches titles and descriptions, ignoring case", () => {
    equal(visibleRequests(rows, { sort: "top", query: "DARK", status: "open" }).map((r) => r.title), ["Dark mode"]);
    equal(visibleRequests(rows, { sort: "top", query: "export desc", status: "open" }).map((r) => r.title), ["CSV export"]);
  });

  test("a status filter shows only that status", () => {
    equal(visibleRequests(rows, { sort: "top", query: "", status: "closed" }).map((r) => r.title), ["Video calls"]);
  });

  test("counts leave merged requests out", () => {
    equal(countFor(rows, "all"), 4);
    equal(countFor(rows, "open"), 3);
    equal(countFor(rows, "closed"), 1);
  });
});
