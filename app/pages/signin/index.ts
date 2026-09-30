import { Request, Response, redirect, session, sql } from "@elements/app";
import { safeNext } from "#app/shared/services/next";
import signin, { DemoLogin, DEMO_EMAILS } from "./template";

export default function route(req: Request, res: Response) {
  let next = safeNext(typeof req.query.next === "string" ? req.query.next : undefined);

  if (session.isLoggedIn()) {
    redirect(next);
    return;
  }

  // The seeded accounts, so a visitor can sign in without signing up.
  let demo = sql<DemoLogin>(`
    select name, email, role from users
     where email = any(${DEMO_EMAILS}::text[])
     order by role, name
  `).all();

  return new signin({ next, demo });
}
