import { Request, Response, redirect, session } from "@elements/app";
import signup from "./template";

export default function route(req: Request, res: Response) {
  if (session.isLoggedIn()) {
    redirect("/");
    return;
  }

  return new signup();
}
