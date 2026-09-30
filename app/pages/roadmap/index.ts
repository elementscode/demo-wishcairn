import { Request, Response } from "@elements/app";
import { requests, myVotes } from "#app/shared/services/board";
import html from "./template";

export default function route(req: Request, res: Response) {
  return new html({ requests: requests.view(), votes: myVotes() });
}
