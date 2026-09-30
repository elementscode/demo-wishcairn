import { sql, tx, session, ValidationError } from "@elements/app";
import { isUserAdminOrThrow } from "#app/shared/services/auth";
import { applyStatus } from "#app/shared/services/board";

export interface LinkedRequest {
  id: string;
  title: string;
}

export interface ChangelogEntry {
  id: string;
  title: string;
  version: string;
  body: string;
  publishedAt: Date;
  authorName: string;
  requests: LinkedRequest[];
}

export interface ChangelogForm {
  title: string;
  version: string;
  body: string;
  requestIds: string[];
  markShipped: boolean;
}

export function listEntries(): ChangelogEntry[] {
  return sql<ChangelogEntry>(`
    select e.id, e.title, e.version, e.body, e.publishedAt, u.name as authorName,
           coalesce(
             json_agg(json_build_object('id', r.id, 'title', r.title) order by r.title)
               filter (where r.id is not null),
             '[]'
           ) as requests
      from changelogEntries e
      join users u on u.id = e.authorId
      left join changelogRequests cr on cr.entryId = e.id
      left join requests r on r.id = cr.requestId
     group by e.id, u.name
     order by e.publishedAt desc
  `).all();
}

/** @rpc */
export function postChangelog(form: ChangelogForm): ChangelogEntry[] {
  isUserAdminOrThrow();

  let title = form.title.trim();
  let body = form.body.trim();
  let version = form.version.trim();
  let errors: Record<string, string[]> = {};

  if (!title) {
    errors.title = ["Give the release a title."];
  }

  if (!body) {
    errors.body = ["Write what changed."];
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  let requestIds = [...new Set(form.requestIds)];

  tx(() => {
    let entry = sql<{ id: string }>(`
      insert into changelogEntries (title, version, body, authorId)
           values (${title}, ${version}, ${body}, ${session.getOrThrow("userId")})
        returning id
    `).firstOrThrow();

    for (let requestId of requestIds) {
      sql(`
        insert into changelogRequests (entryId, requestId)
        select ${entry.id}, id from requests where id = ${requestId}
      `);

      if (form.markShipped) {
        applyStatus(requestId, "shipped");
      }
    }
  });

  return listEntries();
}
