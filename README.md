![Wishcairn, a feature request board built with Elements: requests sorted by top with vote counts and status pills, and a status filter.](POSTER_URL)

# Wishcairn

> A demo app built with [Elements](https://elements.dev).

Feature requests customers vote and comment on live, with team statuses, duplicate merging, a public roadmap, a changelog, and emails to voters when a status changes.

**Demo:** [Wishcairn](TBD)

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
