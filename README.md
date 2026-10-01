![Wishcairn, a feature request board built with Elements: requests sorted by top with vote counts and status pills, and a status filter.](https://elements.dev/demos/01a0f3eb-ef9c-73ed-9b4c-4e490c420ecc/poster?v=83d93d74fb28)

# Wishcairn

> A demo app built with [Elements](https://elements.dev).

Feature requests with live votes and comments, statuses, merges, a public roadmap, a changelog and voter emails.

**Demo:** [Wishcairn](https://elements.dev/demos/01a0f3eb-ef9c-73ed-9b4c-4e490c420ecc)

## Agent specs

What one run of the prompt below took, from an empty Elements project to this
app.

- **Agent:** Claude Code, Opus 5.5 Medium
- **Time:** 19 min
- **Cost:** $6.24 at API rates, September 2026

## Get started

```bash
elements create wishcairn -scaffold=elementscode/demo-wishcairn
```

## How it's built

Wishcairn needed votes and comments that show up on every open page, statuses and merges run by the team, a public roadmap and changelog, and email to voters when their request moves. Each of those is a part of Elements, so the agent spent its 19 minutes on the board itself.

### What Elements gave the app

- **Live requests, votes and comments.** Requests, votes and comments are LiveTables. Vote counts, status changes and merges are written in SQL, and triggers notify each table's channel, so the board, the roadmap and every open request page move together.

- **Votes through a view.** A signed-in visitor opens their own votes as a view, so voting is an insert or delete through it, with the voter set from the session.

- **Statuses and merges.** The team moves and merges requests with `@rpc` functions. A status change is recorded in the request's thread and schedules the voter email in the same transaction, and a merge moves every vote onto the original request.

- **Voter emails.** A background job sends each voter their own email, naming the request a duplicate was merged into.

- **A changelog tied to requests.** Publishing a release links the requests it covers and can mark them shipped, which emails their voters and moves them on the roadmap.

- **Data from SQL files.** Two migrations define the board and its triggers, then seed the feedback board for a team workspace app: 12 accounts, 30 requests across every status, votes, comment threads, a merged duplicate and three changelog entries.

### What the project server gave the agent

The project server runs alongside the agent and answers as soon as a file is saved: it type-checks the templates, TypeScript and SQL, applies migrations and reruns the tests, so every question came back right away and the agent kept building.

### What shipped

The app type-checks with zero errors and all 36 tests pass. Every page works on desktop and phone, and live updates arrive across tabs, such as votes, comments and a roadmap that moves when a release ships.

## Demo accounts

The seed is the feedback board for Loomwork, a made-up team workspace app: 30
requests across all five statuses with votes and comment threads, one duplicate
already merged, and three changelog entries linked to the seven shipped
requests. Every account's password is `wishcairn`, and the sign-in page lists
them. In development, status-change emails are written to
`.elements/logs/job.log` instead of being sent.

| Email               | Role     |
| ------------------- | -------- |
| maya@wishcairn.dev  | admin    |
| theo@wishcairn.dev  | admin    |
| priya@example.com   | customer |
| jonas@example.com   | customer |
| amara@example.com   | customer |
| lucas@example.com   | customer |
| hana@example.com    | customer |
| diego@example.com   | customer |
| erin@example.com    | customer |
| kofi@example.com    | customer |
| sofia@example.com   | customer |
| ben@example.com     | customer |

## The prompt

```text
Build a product feedback board named wishcairn for a software company.

CUSTOMER
- Sign up, submit a feature request with a title and description.
- Browse requests, sort by top or new, search, and upvote.
- Comment on requests.
- Get an email when a request they voted on changes status.

TEAM (admin accounts)
- Set status: under review, planned, in progress, shipped, closed.
- Merge duplicate requests, which moves their votes.
- A public roadmap page with planned, in progress and shipped columns.
- A changelog: post release notes, link the requests they ship.

Seed two admins, ten customers, thirty requests across statuses with votes and
comments, and three changelog entries. Show the seeded logins on the sign-in
page.

Votes, comments and status changes update in real time.
```

## License

MIT. See [LICENSE](LICENSE).
