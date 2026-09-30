import { test, equal, sql, session } from "@elements/app";
import { comments } from "#app/shared/services/board";
import { postComment } from "./template";

test("request page", () => {
  test("posting a comment writes it and clears the draft", () => {
    let user = sql<{ id: string }>(`
      insert into users (name, email, passwordHash) values ('Ada', 'ada@test.dev', 'x') returning id
    `).firstOrThrow();
    let request = sql<{ id: string }>(`
      insert into requests (title, authorId, authorName) values ('Offline mode', ${user.id}, 'Ada') returning id
    `).firstOrThrow();

    session.login({ userId: user.id, userName: "Ada", role: "customer" });

    let draft = { body: "  Same here.  ", error: "" };

    postComment(comments.view({ requestId: request.id }), draft);

    equal(sql<{ body: string }>(`select body from comments`).firstOrThrow().body, "Same here.");
    equal(draft.error, "");
  });

  test("a blank draft posts nothing", () => {
    let draft = { body: "   ", error: "" };

    postComment(comments.view({ requestId: "01a0f3d7-0000-7000-8000-000000000000" }), draft);

    equal(sql<{ n: number }>(`select count(*)::int as n from comments`).firstOrThrow().n, 0);
  });
});
