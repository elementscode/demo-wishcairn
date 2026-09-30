import { test, equal, errorf, sql, session, AuthError } from "@elements/app";
import { signin, signup } from "#app/shared/services/auth";
import { safeNext } from "#app/shared/services/next";

async function expectAuthError(fn: () => unknown, label: string) {
  try {
    await fn();
    errorf("%v: expected AuthError", label);
  } catch (err: any) {
    if (!(err instanceof AuthError)) {
      errorf("%v: expected AuthError, got %v", label, err?.message);
    }
  }
}

test("auth", () => {
  test("sign up creates a customer and signs them in", () => {
    signup("Ada Lovelace", " Ada@Example.com ", "correct horse");

    let user = sql<{ email: string; role: string }>(`select email, role from users where email = 'ada@example.com'`).firstOrThrow();

    equal(user.email, "ada@example.com");
    equal(user.role, "customer");
    equal(session.get("userName"), "Ada Lovelace");
    equal(session.get("role"), "customer");
  });

  test("sign in carries the team role into the session", () => {
    sql(`
      insert into users (name, email, role, passwordHash)
           values ('Maya', 'maya@test.dev', 'admin', crypt('wishcairn', genSalt('bf', 4)))
    `);

    signin("MAYA@test.dev", "wishcairn");

    equal(session.get("role"), "admin");
  });

  test("a wrong password and a taken email are refused", async () => {
    sql(`
      insert into users (name, email, passwordHash)
           values ('Ada', 'ada@test.dev', crypt('right password', genSalt('bf', 4)))
    `);

    await expectAuthError(() => signin("ada@test.dev", "wrong password"), "wrong password");
    await expectAuthError(() => signup("Ada", "ada@test.dev", "another password"), "taken email");
    await expectAuthError(() => signup("Bob", "bob@test.dev", "short"), "short password");
  });

  test("next only follows same-site paths", () => {
    equal(safeNext("/requests/new"), "/requests/new");
    equal(safeNext("//evil.example"), "/");
    equal(safeNext("https://evil.example"), "/");
    equal(safeNext(undefined), "/");
  });
});
