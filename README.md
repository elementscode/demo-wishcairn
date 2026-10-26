![A feature request board with a roadmap, built by Claude Code on Elements: requests sorted by top with vote counts and status pills, and a status filter.](https://elements.dev/demos/01a0f3eb-ef9c-73ed-9b4c-4e490c420ecc/poster?v=83d93d74fb28)

# A feature request board with a roadmap, built by Claude Code on Elements

> Wishcairn is a full-stack app built with Claude Code on Elements.

Feature requests with live votes and comments, statuses, merges, a public roadmap, a changelog and voter emails.

[Run this app on your machine](https://elements.dev/demos/01a0f3eb-ef9c-73ed-9b4c-4e490c420ecc). Use this demo as inspiration, or as the starting point for your own app. Your agent creates a new app with this one as the scaffold, and you prompt it to add whatever features you want.

## How it's built

Wishcairn needed votes and comments that show up on every open page, statuses and merges run by the team, a public roadmap and changelog, and email to voters when their request moves. Each of those is a part of Elements, so the agent spent its 19 minutes on the board itself.

- **Live requests, votes and comments.** Requests, votes and comments are LiveTables. Vote counts, status changes and merges are written in SQL, and triggers notify each table's channel, so the board, the roadmap and every open request page move together.

- **Votes through a view.** A signed-in visitor opens their own votes as a view, so voting is an insert or delete through it, with the voter set from the session.

- **Statuses and merges.** The team moves and merges requests with `@rpc` functions. A status change is recorded in the request's thread and schedules the voter email in the same transaction, and a merge moves every vote onto the original request.

- **Voter emails.** A background job sends each voter their own email, naming the request a duplicate was merged into.

- **A changelog tied to requests.** Publishing a release links the requests it covers and can mark them shipped, which emails their voters and moves them on the roadmap.

- **Data from SQL files.** Two migrations define the board and its triggers, then seed the feedback board for a team workspace app: 12 accounts, 30 requests across every status, votes, comment threads, a merged duplicate and three changelog entries.

## Why Elements

Elements is an integrated full-stack app framework and a project server. The project server checks the agent's work as it builds: it type-checks the server and browser code, analyzes the program, applies migrations and runs the tests, then reports the results to the agent. A security mistake, such as calling a server-only function from the browser, is a compile error. The agent reads the report and fixes its own mistakes before it tells you a feature is done. The same checks run on every feature you ask for next.
