import { test, equal, errorf, sql, session, ForbiddenError } from "@elements/app";
import { postChangelog } from "./services";
import { paragraphs } from "./template";

function makeUser(name: string, role: "customer" | "admin"): { id: string; name: string } {
  return sql<{ id: string; name: string }>(`
    insert into users (name, email, role, passwordHash)
         values (${name}, ${name.toLowerCase() + "@test.dev"}, ${role}::userRole, 'x')
      returning id, name
  `).firstOrThrow();
}

test("changelog", () => {
  test("publishing links requests and marks them shipped", () => {
    let maya = makeUser("Maya", "admin");
    let request = sql<{ id: string }>(`
      insert into requests (title, authorId, authorName, status)
           values ('Timeline view', ${maya.id}, 'Maya', 'in_progress')
        returning id
    `).firstOrThrow();

    session.login({ userId: maya.id, userName: maya.name, role: "admin" });

    let entries = postChangelog({
      title: "Timelines",
      version: "3.7",
      body: "Plan launches on a timeline.",
      requestIds: [request.id],
      markShipped: true,
    });

    equal(entries.length, 1);
    equal(entries[0]!.requests.map((r) => r.title), ["Timeline view"]);
    equal(sql<{ status: string }>(`select status from requests where id = ${request.id}`).firstOrThrow().status, "shipped");
  });

  test("customers cannot publish", async () => {
    let ada = makeUser("Ada", "customer");

    session.login({ userId: ada.id, userName: ada.name, role: "customer" });

    try {
      await postChangelog({ title: "x", version: "", body: "y", requestIds: [], markShipped: false });
      errorf("expected ForbiddenError");
    } catch (err: any) {
      if (!(err instanceof ForbiddenError)) {
        errorf("expected ForbiddenError, got %v", err?.message);
      }
    }
  });

  test("notes split into paragraphs on blank lines", () => {
    equal(paragraphs("One.\n\nTwo,\nstill two.\n\n\n"), ["One.", "Two,\nstill two."]);
  });
});
