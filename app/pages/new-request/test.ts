import { test, equal, sql, session } from "@elements/app";
import { createRequest } from "#app/shared/services/board";

test("new request", () => {
  test("titles and descriptions are trimmed before they are stored", () => {
    let user = sql<{ id: string }>(`
      insert into users (name, email, passwordHash) values ('Ada', 'ada@test.dev', 'x') returning id
    `).firstOrThrow();

    session.login({ userId: user.id, userName: "Ada", role: "customer" });

    try {
      createRequest({ title: "  Offline mode  ", description: "  On the train.  " });
    } catch {
      // The rpc ends by redirecting to the new request.
    }

    let row = sql<{ title: string; description: string }>(`select title, description from requests`).firstOrThrow();

    equal(row.title, "Offline mode");
    equal(row.description, "On the train.");
  });
});
