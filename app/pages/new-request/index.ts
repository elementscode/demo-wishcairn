import { Request, Response, redirect, session } from "@elements/app";
import html from "./template";

export default function route(req: Request, res: Response) {
  if (!session.isLoggedIn()) {
    redirect("/signin?next=/requests/new");
    return;
  }

  return new html();
}
