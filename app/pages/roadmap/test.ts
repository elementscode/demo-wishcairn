import { test, equal } from "@elements/app";
import { FeatureRequest } from "#app/shared/services/board";
import { laneRequests } from "./template";

function row(title: string, status: FeatureRequest["status"], voteCount: number, changedDaysAgo: number): FeatureRequest {
  let at = new Date(Date.now() - changedDaysAgo * 86_400_000);

  return {
    id: title,
    createdAt: at,
    updatedAt: new Date(),
    statusChangedAt: at,
    title,
    description: "",
    status,
    authorId: "a",
    authorName: "Ada",
    voteCount,
    commentCount: 0,
    mergedIntoId: null,
  };
}

test("roadmap", () => {
  let rows = [
    row("Timeline", "planned", 2, 3),
    row("2FA", "planned", 8, 9),
    row("API", "in_progress", 5, 1),
    row("Markdown", "shipped", 20, 60),
    row("Drag and drop", "shipped", 1, 5),
  ];

  test("planned ranks by votes", () => {
    equal(laneRequests(rows, "planned").map((r) => r.title), ["2FA", "Timeline"]);
  });

  test("shipped reads newest first, whatever the votes", () => {
    equal(laneRequests(rows, "shipped").map((r) => r.title), ["Drag and drop", "Markdown"]);
  });
});
