import { Request, Response } from "@elements/app";
import { requests } from "#app/shared/services/board";
import { listEntries } from "./services";
import html from "./template";

export default function route(req: Request, res: Response) {
  return new html({ entries: listEntries(), requests: requests.view() });
}
