import { test, assert, equal, errorf, sql, session, AuthError, ForbiddenError, ValidationError } from "@elements/app";
import {
  votes,
  comments,
  requests,
  createRequest,
  setStatus,
  mergeRequest,
  applyStatus,
} from "#app/shared/services/board";

interface Person {
  id: string;
  name: string;
}

function makeUser(name: string, role: "customer" | "admin" = "customer"): Person {
  let email = `${name.toLowerCase()}@test.dev`;

  return sql<Person>(`
    insert into users (name, email, role, passwordHash)
         values (${name}, ${email}, ${role}::userRole, 'x')
      returning id, name
  `).firstOrThrow();
}

function makeRequest(author: Person, title: string): string {
  return sql<{ id: string }>(`
    insert into requests (title, description, authorId, authorName)
         values (${title}, '', ${author.id}, ${author.name})
      returning id
  `).firstOrThrow().id;
}

function signInAs(user: Person, role: "customer" | "admin" = "customer") {
  session.login({ userId: user.id, userName: user.name, role });
}

function voteCount(requestId: string): number {
  return sql<{ voteCount: number }>(`select voteCount from requests where id = ${requestId}`).firstOrThrow().voteCount;
}

async function expectError(fn: () => unknown, kind: Function, label: string) {
  try {
    await fn();
    errorf("%v: expected an error", label);
  } catch (err: any) {
    if (!(err instanceof kind)) {
      errorf("%v: expected %v, got %v", label, kind.name, err?.constructor?.name + ": " + err?.message);
    }
  }
}

test("votes", async () => {
  test("a customer's vote counts once and can be taken back", async () => {
    let ada = makeUser("Ada");
    let id = makeRequest(ada, "Dark mode");

    signInAs(ada);

    let mine = votes.view({ userId: ada.id });
    let vote = mine.insert({ requestId: id });

    equal(voteCount(id), 1);

    mine.delete(vote);

    equal(voteCount(id), 0);
  });

  test("the database refuses a second vote from the same person", async () => {
    let ada = makeUser("Ada");
    let id = makeRequest(ada, "Dark mode");

    signInAs(ada);
    votes.view({ userId: ada.id }).insert({ requestId: id });

    // The unique index is the guarantee; the failed insert aborts this test's transaction.
    await expectError(() => votes.view({ userId: ada.id }).insert({ requestId: id }), Error, "duplicate vote");
  });

  test("a visitor cannot vote", async () => {
    let ada = makeUser("Ada");
    let id = makeRequest(ada, "Dark mode");

    await expectError(() => votes.view({ userId: ada.id }).insert({ requestId: id }), AuthError, "anonymous vote");
  });

  test("no one can remove another person's vote", async () => {
    let ada = makeUser("Ada");
    let bob = makeUser("Bob");
    let id = makeRequest(ada, "Dark mode");

    signInAs(ada);
    let vote = votes.view({ userId: ada.id }).insert({ requestId: id });

    signInAs(bob);
    await expectError(() => votes.view({ userId: ada.id }).delete(vote), ForbiddenError, "delete other's vote");
    equal(voteCount(id), 1);
  });
});

test("comments", async () => {
  test("the server stamps the author and counts the comment", async () => {
    let ada = makeUser("Ada");
    let id = makeRequest(ada, "Dark mode");

    signInAs(ada);
    comments.view({ requestId: id }).insert({ userName: "Someone Else", isTeam: true, kind: "comment", body: "  me too  " });

    let row = sql<{ userName: string; isTeam: boolean; body: string }>(`
      select userName, isTeam, body from comments where requestId = ${id}
    `).firstOrThrow();

    equal(row.userName, "Ada");
    equal(row.isTeam, false);
    equal(row.body, "me too");
    equal(sql<{ commentCount: number }>(`select commentCount from requests where id = ${id}`).firstOrThrow().commentCount, 1);
  });

  test("an empty comment is refused", async () => {
    let ada = makeUser("Ada");
    let id = makeRequest(ada, "Dark mode");

    signInAs(ada);
    await expectError(() => comments.view({ requestId: id }).insert({ body: "   " }), ValidationError, "empty comment");
  });

  test("the team's comments are marked as the team's", async () => {
    let ada = makeUser("Ada");
    let maya = makeUser("Maya", "admin");
    let id = makeRequest(ada, "Dark mode");

    signInAs(maya, "admin");
    comments.view({ requestId: id }).insert({ body: "On it." });

    equal(sql<{ isTeam: boolean }>(`select isTeam from comments where requestId = ${id}`).firstOrThrow().isTeam, true);
  });
});

test("requests", async () => {
  test("posting a request records the author's vote", async () => {
    let ada = makeUser("Ada");

    signInAs(ada);

    try {
      createRequest({ title: "Export to CSV", description: "Weekly reports." });
    } catch (err: any) {
      // The rpc ends by redirecting to the new request; the write is what counts.
    }

    let row = sql<{ id: string; voteCount: number; authorName: string }>(`
      select id, voteCount, authorName from requests where title = 'Export to CSV'
    `).firstOrThrow("request was not created");

    equal(row.voteCount, 1);
    equal(row.authorName, "Ada");
  });

  test("a title that is too short is refused", async () => {
    let ada = makeUser("Ada");

    signInAs(ada);
    await expectError(() => createRequest({ title: "x", description: "" }), ValidationError, "short title");
  });

  test("the browser cannot write requests directly", async () => {
    let ada = makeUser("Ada");

    signInAs(ada);
    await expectError(() => requests.view().insert({ title: "Sneaky" }), ForbiddenError, "direct insert");
  });
});

test("status", async () => {
  test("only the team can change a status", async () => {
    let ada = makeUser("Ada");
    let id = makeRequest(ada, "Dark mode");

    signInAs(ada, "admin");
    await expectError(() => setStatus(id, "planned"), ForbiddenError, "customer sets status");
  });

  test("a change is recorded in the thread and queues the voters' email", async () => {
    let ada = makeUser("Ada");
    let maya = makeUser("Maya", "admin");
    let id = makeRequest(ada, "Dark mode");

    sql(`insert into votes (requestId, userId) values (${id}, ${ada.id})`);

    signInAs(maya, "admin");
    setStatus(id, "planned");

    equal(sql<{ status: string }>(`select status from requests where id = ${id}`).firstOrThrow().status, "planned");

    let event = sql<{ kind: string; body: string }>(`
      select kind, body from comments where requestId = ${id}
    `).firstOrThrow("no status entry");

    equal(event.kind, "status");
    equal(event.body, "planned");

    let jobs = sql<{ n: number }>(`
      select count(*)::int as n from elements.jobs where fields::text like ${"%" + id + "%"}
    `).firstOrThrow();

    equal(jobs.n, 1);
  });

  test("setting the same status again does nothing", async () => {
    let ada = makeUser("Ada");
    let maya = makeUser("Maya", "admin");
    let id = makeRequest(ada, "Dark mode");

    signInAs(maya, "admin");
    applyStatus(id, "under_review");

    assert(sql(`select 1 from comments where requestId = ${id}`).empty(), "no entry for a no-op");
  });

  test("an unknown status is refused", async () => {
    let maya = makeUser("Maya", "admin");
    let id = makeRequest(maya, "Dark mode");

    signInAs(maya, "admin");
    await expectError(() => setStatus(id, "someday"), ValidationError, "unknown status");
  });
});

test("merge", async () => {
  test("moves votes to the original, once per person, and closes the duplicate", async () => {
    let ada = makeUser("Ada");
    let bob = makeUser("Bob");
    let cy = makeUser("Cy");
    let maya = makeUser("Maya", "admin");
    let original = makeRequest(ada, "Dark mode");
    let duplicate = makeRequest(bob, "Dark theme");

    sql(`
      insert into votes (requestId, userId)
           values (${original}, ${ada.id}),
                  (${duplicate}, ${ada.id}),
                  (${duplicate}, ${bob.id}),
                  (${duplicate}, ${cy.id})
    `);

    signInAs(maya, "admin");
    mergeRequest(duplicate, original);

    equal(voteCount(original), 3);
    equal(voteCount(duplicate), 0);

    let dup = sql<{ status: string; mergedIntoId: string }>(`
      select status, mergedIntoId from requests where id = ${duplicate}
    `).firstOrThrow();

    equal(dup.status, "closed");
    equal(dup.mergedIntoId, original);

    let note = sql<{ body: string }>(`
      select body from comments where requestId = ${original} and kind = 'merge'
    `).firstOrThrow("no merge entry");

    equal(note.body, "Dark theme");
  });

  test("a request cannot merge into itself or twice", async () => {
    let ada = makeUser("Ada");
    let maya = makeUser("Maya", "admin");
    let a = makeRequest(ada, "Dark mode");
    let b = makeRequest(ada, "Dark theme");

    signInAs(maya, "admin");
    await expectError(() => mergeRequest(a, a), ValidationError, "self merge");

    mergeRequest(b, a);
    await expectError(() => mergeRequest(b, a), ValidationError, "second merge");
  });

  test("a merged request takes no new votes", async () => {
    let ada = makeUser("Ada");
    let maya = makeUser("Maya", "admin");
    let a = makeRequest(ada, "Dark mode");
    let b = makeRequest(ada, "Dark theme");

    signInAs(maya, "admin");
    mergeRequest(b, a);

    signInAs(ada);
    await expectError(() => votes.view({ userId: ada.id }).insert({ requestId: b }), ValidationError, "vote on merged");
  });
});
