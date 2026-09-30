import { Job, email, sql } from "@elements/app";
import StatusChangedEmail from "#app/emails/status-changed";
import { Status, statusLabel } from "#app/shared/services/status";

export interface StatusChangedJobFields {
  requestId: string;
  status: Status;
  userIds: string[];
}

interface Recipient {
  email: string;
  name: string;
}

interface RequestSummary {
  title: string;
  mergedIntoId: string | null;
  mergedTitle: string | null;
}

/**
 * Emails each voter, one message apiece so no one sees another's address.
 * The voter list is taken when the status changes; a merge has already moved
 * the votes by the time this runs.
 */
export class StatusChangedJob extends Job<StatusChangedJobFields> {
  static maxAttempts = 5;

  run() {
    let { requestId, status, userIds } = this.fields;

    let request = sql<RequestSummary>(`
      select r.title, r.mergedIntoId, m.title as mergedTitle
        from requests r
        left join requests m on m.id = r.mergedIntoId
       where r.id = ${requestId}
    `).first();

    if (!request) {
      return;
    }

    let recipients = sql<Recipient>(`
      select email, name from users where id = any(${userIds}::uuid[])
    `).all();

    let merged = request.mergedIntoId && request.mergedTitle;

    for (let to of recipients) {
      email({
        to: to.email,
        subject: merged
          ? `Merged: ${request.title}`
          : `${statusLabel(status)}: ${request.title}`,
        body: new StatusChangedEmail({
          name: to.name.split(" ")[0],
          title: request.title,
          statusLabel: statusLabel(status),
          url: `/requests/${requestId}`,
          mergedTitle: merged ? request.mergedTitle! : "",
          mergedUrl: merged ? `/requests/${request.mergedIntoId}` : "",
        }),
      });
    }
  }
}
