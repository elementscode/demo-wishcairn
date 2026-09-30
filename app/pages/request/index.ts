import { Request, Response, NotFoundError, sql } from "@elements/app";
import { requests, comments, myVotes } from "#app/shared/services/board";
import html, { ShippedIn } from "./template";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function route(req: Request, res: Response) {
  let id = String(req.params.id ?? "");

  if (!UUID.test(id) || sql(`select 1 from requests where id = ${id}`).empty()) {
    throw new NotFoundError("request not found");
  }

  let shippedIn = sql<ShippedIn>(`
    select e.id, e.title, e.version, e.publishedAt
      from changelogRequests cr
      join changelogEntries e on e.id = cr.entryId
     where cr.requestId = ${id}
     order by e.publishedAt desc
  `).all();

  return new html({
    id,
    requests: requests.view(),
    votes: myVotes(),
    comments: comments.view({ requestId: id }),
    shippedIn,
  });
}
