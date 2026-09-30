import { test, equal, sql, session } from "@elements/app";
import { comments } from "#app/shared/services/board";
import { postComment } from "./template";

test("request page", () => {
  test("posting a comment writes it and clears the draft", () => {
    let email = `ada-${crypto.randomUUID().slice(0, 8)}@test.dev`;
    let user = sql<{ id: string }>(`
      insert into users (name, email, passwordHash) values ('Ada', ${email}, 'x') returning id
    `).firstOrThrow();
    let request = sql<{ id: string }>(`
      insert into requests (title, authorId, authorName) values ('Offline mode', ${user.id}, 'Ada') returning id
    `).firstOrThrow();

    session.login({ userId: user.id, userName: "Ada", role: "customer" });

    let draft = { body: "  Same here.  ", error: "" };

    postComment(comments.view({ requestId: request.id }), draft);

    equal(sql<{ body: string }>(`select body from comments where requestId = ${request.id}`).firstOrThrow().body, "Same here.");
    equal(draft.error, "");
  });

  test("a blank draft posts nothing", () => {
    let requestId = "01a0f3d7-0000-7000-8000-000000000000";
    let draft = { body: "   ", error: "" };

    postComment(comments.view({ requestId }), draft);

    equal(sql<{ n: number }>(`select count(*)::int as n from comments where requestId = ${requestId}`).firstOrThrow().n, 0);
  });
});
