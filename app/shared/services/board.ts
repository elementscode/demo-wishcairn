import {
  LiveTable,
  LiveView,
  sql,
  tx,
  session,
  redirect,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@elements/app";
import { isUserAdminOrThrow } from "#app/shared/services/auth";
import { Status, isStatus } from "#app/shared/services/status";
import { StatusChangedJob } from "#app/jobs/status-changed";

export interface FeatureRequest {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  description: string;
  status: Status;
  authorId: string;
  authorName: string;
  voteCount: number;
  commentCount: number;
  mergedIntoId: string | null;
  statusChangedAt: Date;
}

export interface Vote {
  id: string;
  requestId: string;
  userId: string;
}

export interface Comment {
  id: string;
  createdAt: Date;
  requestId: string;
  userId: string;
  userName: string;
  isTeam: boolean;
  kind: "comment" | "status" | "merge";
  body: string;
}

export const MAX_TITLE = 120;
export const MAX_DESCRIPTION = 4000;
export const MAX_COMMENT = 4000;

// The migration's triggers notify each table's channel: counts, status
// changes and merges are written in SQL, not through a view.
export let requests: LiveTable<FeatureRequest> = new LiveTable<FeatureRequest>({
  select: () => sql<FeatureRequest>(`
    select id, createdAt, updatedAt, title, description, status, authorId,
           authorName, voteCount, commentCount, mergedIntoId, statusChangedAt
      from requests
  `),
  insert: () => {
    throw new ForbiddenError();
  },
  update: () => {
    throw new ForbiddenError();
  },
  delete: () => {
    throw new ForbiddenError();
  },
});

export let votes: LiveTable<Vote> = new LiveTable<Vote>({
  insert: (item) => {
    session.isLoggedInOrThrow();

    let open = !sql(`
      select 1 from requests where id = ${item.requestId} and mergedIntoId is null
    `).empty();

    if (!open) {
      throw new ValidationError("That request was merged into another one.");
    }

    return votes.insert({ id: item.id, requestId: item.requestId, userId: session.getOrThrow("userId") });
  },
  update: () => {
    throw new ForbiddenError();
  },
  delete: (item) => {
    session.isLoggedInOrThrow();

    let owned = !sql(`
      select 1 from votes where id = ${item.id} and userId = ${session.getOrThrow("userId")}
    `).empty();

    if (!owned) {
      throw new ForbiddenError();
    }

    return votes.delete(item);
  },
});

export let comments: LiveTable<Comment> = new LiveTable<Comment>({
  insert: (item) => {
    session.isLoggedInOrThrow();

    let body = (item.body ?? "").trim();

    if (!body) {
      throw new ValidationError("Write something first.");
    }

    if (body.length > MAX_COMMENT) {
      throw new ValidationError(`Comments are limited to ${MAX_COMMENT} characters.`);
    }

    let user = sql<{ name: string; role: string }>(`
      select name, role from users where id = ${session.getOrThrow("userId")}
    `).firstOrThrow("user not found");

    return comments.insert({
      id: item.id,
      requestId: item.requestId,
      userId: session.getOrThrow("userId"),
      userName: user.name,
      isTeam: user.role === "admin",
      kind: "comment",
      body,
    });
  },
  update: () => {
    throw new ForbiddenError();
  },
  delete: (item) => {
    session.isLoggedInOrThrow();

    let row = sql<{ userId: string; kind: string }>(`
      select userId, kind from comments where id = ${item.id}
    `).firstOrThrow("comment not found");

    let userId = session.getOrThrow("userId");

    if (row.kind !== "comment" || (row.userId !== userId && session.get("role") !== "admin")) {
      throw new ForbiddenError();
    }

    return comments.delete(item);
  },
});

/** Opens the signed-in visitor's own votes, or nothing for a visitor. */
export function myVotes(): LiveView<Vote> | undefined {
  let userId = session.get("userId");

  return userId ? votes.view({ userId }) : undefined;
}

export interface NewRequestForm {
  title: string;
  description: string;
}

/** @rpc */
export function createRequest(form: NewRequestForm) {
  session.isLoggedInOrThrow();

  let title = form.title.trim();
  let description = form.description.trim();
  let errors: Record<string, string[]> = {};

  if (title.length < 4) {
    errors.title = ["Give it a title of at least a few words."];
  } else if (title.length > MAX_TITLE) {
    errors.title = [`Keep the title under ${MAX_TITLE} characters.`];
  }

  if (description.length > MAX_DESCRIPTION) {
    errors.description = [`Keep the description under ${MAX_DESCRIPTION} characters.`];
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  let id = tx(() => {
    let userId = session.getOrThrow("userId");

    let row = sql<{ id: string }>(`
      insert into requests (title, description, authorId, authorName)
           values (${title}, ${description}, ${userId}, ${session.getOrThrow("userName")})
        returning id
    `).firstOrThrow();

    sql(`insert into votes (requestId, userId) values (${row.id}, ${userId})`);

    return row.id;
  });

  redirect(`/requests/${id}`);
}

function voterIds(requestId: string): string[] {
  return sql<{ userId: string }>(`select userId from votes where requestId = ${requestId}`)
    .all()
    .map((v) => v.userId);
}

/**
 * Moves a request to a new status, records it in the thread, and queues the
 * email to its voters in the same transaction, so a rollback sends nothing.
 * Server-only: callers check the role first.
 */
export function applyStatus(requestId: string, status: Status) {
  tx(() => {
    let current = sql<{ status: Status; mergedIntoId: string | null }>(`
      select status, mergedIntoId from requests where id = ${requestId} for update
    `).first();

    if (!current) {
      throw new NotFoundError("request not found");
    }

    if (current.mergedIntoId) {
      throw new ValidationError("A merged request keeps its status.");
    }

    if (current.status === status) {
      return;
    }

    let userId = session.getOrThrow("userId");

    sql(`update requests set status = ${status}, statusChangedAt = now() where id = ${requestId}`);

    sql(`
      insert into comments (requestId, userId, userName, isTeam, kind, body)
           values (${requestId}, ${userId}, ${session.getOrThrow("userName")}, true, 'status', ${status})
    `);

    let recipients = voterIds(requestId).filter((id) => id !== userId);

    if (recipients.length > 0) {
      new StatusChangedJob({ requestId, status, userIds: recipients }).schedule();
    }
  });
}

/** @rpc */
export function setStatus(requestId: string, status: string) {
  isUserAdminOrThrow();

  if (!isStatus(status)) {
    throw new ValidationError("Unknown status.");
  }

  applyStatus(requestId, status);
}

/** @rpc */
export function mergeRequest(sourceId: string, targetId: string) {
  isUserAdminOrThrow();

  if (sourceId === targetId) {
    throw new ValidationError("Pick a different request to merge into.");
  }

  tx(() => {
    let rows = sql<{ id: string; title: string; mergedIntoId: string | null }>(`
      select id, title, mergedIntoId from requests
       where id in (${sourceId}, ${targetId})
         for update
    `).all();

    let source = rows.find((r) => r.id === sourceId);
    let target = rows.find((r) => r.id === targetId);

    if (!source || !target) {
      throw new NotFoundError("request not found");
    }

    if (source.mergedIntoId || target.mergedIntoId) {
      throw new ValidationError("That request has already been merged.");
    }

    let userId = session.getOrThrow("userId");
    let userName = session.getOrThrow("userName");
    let recipients = voterIds(sourceId).filter((id) => id !== userId);

    sql(`
      insert into votes (requestId, userId, createdAt)
      select ${targetId}, userId, createdAt from votes where requestId = ${sourceId}
      on conflict (requestId, userId) do nothing
    `);

    sql(`delete from votes where requestId = ${sourceId}`);

    sql(`update requests set status = 'closed', statusChangedAt = now(), mergedIntoId = ${targetId} where id = ${sourceId}`);

    // A request that had been merged into the source now points at the target.
    sql(`update requests set mergedIntoId = ${targetId} where mergedIntoId = ${sourceId}`);

    sql(`
      insert into comments (requestId, userId, userName, isTeam, kind, body)
           values (${targetId}, ${userId}, ${userName}, true, 'merge', ${source.title})
    `);

    if (recipients.length > 0) {
      new StatusChangedJob({ requestId: sourceId, status: "closed", userIds: recipients }).schedule();
    }
  });
}
