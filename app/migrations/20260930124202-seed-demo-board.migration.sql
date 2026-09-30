-- seed demo board: the feedback board for Loomwork, a team workspace app with 12 demo accounts
/** @env development */

-- Every demo account signs in with the password "wishcairn".
insert into users (email, name, role, passwordHash)
select email, name, role::userRole, crypt('wishcairn', genSalt('bf', 10))
  from (values
    ('maya@wishcairn.dev',  'Maya Okafor',     'admin'),
    ('theo@wishcairn.dev',  'Theo Lindqvist',  'admin'),
    ('priya@example.com',   'Priya Raman',     'customer'),
    ('jonas@example.com',   'Jonas Weber',     'customer'),
    ('amara@example.com',   'Amara Nwosu',     'customer'),
    ('lucas@example.com',   'Lucas Moreau',    'customer'),
    ('hana@example.com',    'Hana Sato',       'customer'),
    ('diego@example.com',   'Diego Alvarez',   'customer'),
    ('erin@example.com',    'Erin Walsh',      'customer'),
    ('kofi@example.com',    'Kofi Mensah',     'customer'),
    ('sofia@example.com',   'Sofia Rossi',     'customer'),
    ('ben@example.com',     'Ben Carter',      'customer')
  ) as s(email, name, role);

insert into requests (title, description, status, authorId, authorName, createdAt)
select s.title, s.description, s.status::requestStatus, u.id, u.name, now() - (s.daysAgo || ' days')::interval - (s.hoursAgo || ' hours')::interval
  from (values
    ('Dark mode for the editor', 'Long writing sessions at night are rough on the eyes with the bright editor. A dark theme that follows the OS setting would be ideal, with a manual override in settings.', 'under_review', 'priya@example.com', 3, 4),
    ('Export boards to CSV', 'We report on task throughput in a spreadsheet every Friday. Being able to export a board, with assignee, status and due date columns, would save us from copying rows by hand.', 'under_review', 'jonas@example.com', 5, 2),
    ('Keyboard shortcut cheat sheet', 'There are clearly a lot of shortcuts but I only find them by accident. Pressing ? to open a list of every shortcut would help new people on our team.', 'under_review', 'lucas@example.com', 8, 7),
    ('Custom fields on tasks', 'Our support team needs a customer name and a priority tier on every task. Custom fields (text, number, dropdown) that we can filter and sort by would let us drop our side spreadsheet.', 'under_review', 'amara@example.com', 12, 1),
    ('Undo for bulk actions', 'I moved forty tasks to the wrong column last week and had to move them back one at a time. An undo toast after a bulk move or bulk delete would have saved an afternoon.', 'under_review', 'hana@example.com', 2, 9),
    ('Offline mode for the mobile app', 'I review tasks on the train with no signal. Read access to recent projects offline, and queuing edits until I reconnect, would make the app usable on my commute.', 'under_review', 'diego@example.com', 20, 3),
    ('Pin comments to the top of a doc', 'Decisions get buried under discussion. Pinning a comment so it shows above the thread would make the outcome of a long conversation easy to find.', 'under_review', 'erin@example.com', 1, 5),
    ('Weekly digest of my assigned tasks', 'A Monday morning email listing what is assigned to me and due this week would replace the reminder I set in my calendar.', 'under_review', 'kofi@example.com', 15, 6),
    ('Emoji reactions on comments', 'Half our comments are "sounds good" or "+1". Reactions would keep threads shorter and the signal easier to see.', 'under_review', 'sofia@example.com', 6, 2),
    ('Two-factor authentication', 'Our security review requires 2FA for every SaaS tool we use. TOTP apps at minimum, with the option for an admin to require it for the whole workspace.', 'planned', 'ben@example.com', 40, 1),
    ('Recurring tasks', 'Monthly invoicing, weekly standup notes, quarterly reviews: we recreate the same tasks by hand. A repeat rule on a task (daily, weekly, monthly) would handle it.', 'planned', 'priya@example.com', 55, 4),
    ('Timeline view', 'A Gantt-style timeline showing tasks by start and due date would help us plan launches and spot overlapping work across the team.', 'planned', 'jonas@example.com', 48, 3),
    ('Import boards from other tools', 'We have four years of boards in another tool. An importer that keeps lists, cards, checklists, labels and comments would make switching an easy decision.', 'planned', 'amara@example.com', 35, 8),
    ('Permissions per folder', 'Contractors should see the client folder they work in and nothing else. Today it is all or nothing at the workspace level.', 'planned', 'lucas@example.com', 30, 2),
    ('Chat notifications per project', 'Posting task updates to a team chat channel we choose, per project, would keep the people who never open Loomwork in the loop.', 'planned', 'hana@example.com', 42, 5),
    ('Public API with personal access tokens', 'We want to create tasks from our support desk and pull status into our dashboards. A REST API with personal tokens would cover both.', 'in_progress', 'diego@example.com', 70, 2),
    ('Faster search across all workspaces', 'Search takes several seconds on our large workspace and only covers the one I am in. Searching everything I can see, quickly, would change how I use the product.', 'in_progress', 'erin@example.com', 64, 6),
    ('Sync due dates to my calendar', 'Tasks with due dates should show up on my work calendar, and moving them there should move the due date back here.', 'in_progress', 'kofi@example.com', 58, 1),
    ('Task dependencies', 'Marking a task as blocked by another, and having the blocked one show that clearly, would stop people from starting work that cannot finish.', 'in_progress', 'sofia@example.com', 61, 4),
    ('Bulk edit due dates', 'When a launch slips a week, shifting every due date in a project by the same amount should be one action, not thirty.', 'in_progress', 'ben@example.com', 50, 7),
    ('Markdown shortcuts in the editor', 'Typing ## for a heading or - for a list, like most editors now, would make writing docs much faster.', 'shipped', 'priya@example.com', 90, 3),
    ('Email me when I am mentioned', 'I miss mentions when I am not in the app. An email for each mention, or a short batch of them, would fix that.', 'shipped', 'jonas@example.com', 88, 1),
    ('Duplicate a project with its tasks', 'We run the same onboarding project for every new client. Duplicating a project with its tasks and structure, but not the comments, would save a lot of setup.', 'shipped', 'amara@example.com', 85, 5),
    ('Archive instead of delete', 'Deleting a finished project loses its history. Archiving it out of the sidebar but keeping it searchable would be safer.', 'shipped', 'lucas@example.com', 80, 2),
    ('Sort tasks by due date', 'The list view only sorts by creation date. Sorting by due date is the one I need every morning.', 'shipped', 'hana@example.com', 78, 6),
    ('Attach files by drag and drop', 'Dragging a file from the desktop onto a task should attach it, without going through the upload dialog.', 'shipped', 'diego@example.com', 76, 4),
    ('Unread count in the browser tab', 'Showing the number of unread notifications in the tab title would let me keep Loomwork pinned and notice new activity.', 'shipped', 'erin@example.com', 74, 2),
    ('Built-in video calls', 'Starting a video call from inside a task, with the task open beside it, would keep discussion next to the work.', 'closed', 'kofi@example.com', 60, 3),
    ('Store the audit log on a blockchain', 'An immutable audit log would help us prove to auditors that nothing was edited after the fact.', 'closed', 'sofia@example.com', 45, 8),
    ('Dark theme please', 'Everything is so bright. Could we get a dark theme?', 'closed', 'ben@example.com', 2, 1)
  ) as s(title, description, status, email, daysAgo, hoursAgo)
  join users u on u.email = s.email;

update requests
   set statusChangedAt = case when status = 'under_review' then createdAt else createdAt + interval '3 days' end;

update requests
   set mergedIntoId = (select id from requests where title = 'Dark mode for the editor')
 where title = 'Dark theme please';

-- Authors vote for their own request; other customers vote by a stable hash,
-- weighted so work the team has picked up has drawn more interest.
insert into votes (requestId, userId, createdAt)
select r.id, u.id, r.createdAt + interval '1 minute'
  from requests r
  join users u on u.id = r.authorId
 where r.mergedIntoId is null;

insert into votes (requestId, userId, createdAt)
select r.id, u.id, r.createdAt + ((abs(hashtext(u.email || r.title)) % 48) || ' hours')::interval
  from requests r
  cross join users u
 where u.role = 'customer'
   and u.id <> r.authorId
   and r.mergedIntoId is null
   and abs(hashtext(r.title || u.email)) % 10 <
       case r.status
         when 'under_review' then 1 + abs(hashtext(r.title)) % 7
         when 'planned' then 4 + abs(hashtext(r.title)) % 6
         when 'in_progress' then 5 + abs(hashtext(r.title)) % 5
         when 'shipped' then 4 + abs(hashtext(r.title)) % 6
         else abs(hashtext(r.title)) % 3
       end;

-- The duplicate's voter moved to the original when it was merged.
insert into votes (requestId, userId, createdAt)
select r.id, u.id, now() - interval '1 day'
  from requests r, users u
 where r.title = 'Dark mode for the editor'
   and u.email = 'ben@example.com'
on conflict do nothing;

insert into comments (requestId, userId, userName, isTeam, kind, body, createdAt)
select r.id, u.id, u.name, u.role = 'admin', 'comment', s.body, r.createdAt + (s.hoursAfter || ' hours')::interval
  from (values
    ('Dark mode for the editor', 'jonas@example.com', 'Yes please. Following the OS setting would be perfect.', 5),
    ('Dark mode for the editor', 'hana@example.com', 'Would this include the sidebar and the mobile app, or just the editor?', 20),
    ('Dark mode for the editor', 'maya@wishcairn.dev', 'Thanks all. We are looking at the whole app rather than the editor alone, so the answer would be both. More soon.', 30),
    ('Export boards to CSV', 'erin@example.com', 'A spreadsheet format too, if possible. Our finance team does not like CSV dates.', 10),
    ('Export boards to CSV', 'amara@example.com', 'CSV is fine for us, as long as custom fields come along.', 40),
    ('Keyboard shortcut cheat sheet', 'priya@example.com', 'A command palette would cover this too.', 6),
    ('Custom fields on tasks', 'kofi@example.com', 'Same need here. A date field would let us track contract renewals.', 14),
    ('Custom fields on tasks', 'theo@wishcairn.dev', 'This comes up in most of our customer calls. Which field types would you need on day one?', 50),
    ('Custom fields on tasks', 'amara@example.com', 'Dropdown and text would cover 90% of it for us.', 60),
    ('Undo for bulk actions', 'lucas@example.com', 'Been there. Even a 10 second undo would do.', 3),
    ('Offline mode for the mobile app', 'sofia@example.com', 'Read-only offline would already be a huge help.', 30),
    ('Weekly digest of my assigned tasks', 'ben@example.com', 'Could it be Sunday evening instead of Monday morning? A setting would be great.', 24),
    ('Emoji reactions on comments', 'diego@example.com', 'Please keep it to a small set. Huge reaction pickers get out of hand.', 12),
    ('Two-factor authentication', 'erin@example.com', 'Blocking our rollout to the rest of the company, so very keen on this one.', 20),
    ('Two-factor authentication', 'maya@wishcairn.dev', 'Planned for next quarter. We will start with TOTP apps and recovery codes, with passkeys to follow.', 72),
    ('Two-factor authentication', 'jonas@example.com', 'Passkeys would be great, thank you.', 80),
    ('Recurring tasks', 'hana@example.com', 'Please support "last weekday of the month". We close books on it.', 30),
    ('Recurring tasks', 'theo@wishcairn.dev', 'Noted. We are designing the repeat rules now and that one is on the list.', 200),
    ('Timeline view', 'lucas@example.com', 'Drag to reschedule on the timeline would be the killer feature.', 18),
    ('Import boards from other tools', 'kofi@example.com', 'Attachments too, please. We have years of files on cards.', 22),
    ('Permissions per folder', 'priya@example.com', 'Agencies need this. We cannot invite clients until it exists.', 16),
    ('Chat notifications per project', 'sofia@example.com', 'A plain webhook option as well would be appreciated.', 9),
    ('Public API with personal access tokens', 'amara@example.com', 'Webhooks would be the other half of this for us.', 26),
    ('Public API with personal access tokens', 'theo@wishcairn.dev', 'Tokens and the tasks endpoints are in private beta now. Webhooks are next on the list.', 900),
    ('Public API with personal access tokens', 'jonas@example.com', 'Could we join the beta?', 920),
    ('Faster search across all workspaces', 'ben@example.com', 'Search is the thing I use most and it is the slowest part of the app.', 11),
    ('Faster search across all workspaces', 'maya@wishcairn.dev', 'We are rebuilding the index. Early numbers on large workspaces are under 200ms.', 600),
    ('Sync due dates to my calendar', 'hana@example.com', 'Two-way would be ideal but one-way would already help.', 40),
    ('Task dependencies', 'diego@example.com', 'Would be great if a blocked task could not be moved to Done.', 15),
    ('Bulk edit due dates', 'erin@example.com', 'Shift by working days please, not calendar days.', 8),
    ('Markdown shortcuts in the editor', 'lucas@example.com', 'Love this, thank you!', 1500),
    ('Email me when I am mentioned', 'amara@example.com', 'The batching works well. No more notification storms.', 1600),
    ('Duplicate a project with its tasks', 'kofi@example.com', 'This saves me an hour for every client. Thanks.', 1500),
    ('Archive instead of delete', 'hana@example.com', 'Could archived projects be restored by anyone, or only admins?', 1200),
    ('Archive instead of delete', 'theo@wishcairn.dev', 'Anyone who could edit the project can restore it.', 1210),
    ('Attach files by drag and drop', 'sofia@example.com', 'Works great, including multiple files at once.', 1400),
    ('Unread count in the browser tab', 'kofi@example.com', 'Small change, big difference. I catch replies much faster now.', 1650),
    ('Sort tasks by due date', 'erin@example.com', 'This is now my default view. Thank you.', 300),
    ('Pin comments to the top of a doc', 'jonas@example.com', 'Yes. Our design reviews end with a decision nobody can find a week later.', 10),
    ('Built-in video calls', 'erin@example.com', 'We already have a video tool for this, not sure it needs to be built in.', 12),
    ('Built-in video calls', 'maya@wishcairn.dev', 'We are closing this one. Linking a call from your video tool onto a task covers most of the need, and that is supported today.', 300),
    ('Store the audit log on a blockchain', 'theo@wishcairn.dev', 'Our audit log is append-only and exportable, which auditors have accepted. We will not be building this.', 100)
  ) as s(title, email, body, hoursAfter)
  join requests r on r.title = s.title
  join users u on u.email = s.email;

insert into comments (requestId, userId, userName, isTeam, kind, body, createdAt)
select r.id, u.id, u.name, true, 'merge', d.title, now() - interval '1 day'
  from requests r
  join requests d on d.mergedIntoId = r.id
  join users u on u.email = 'maya@wishcairn.dev';

insert into changelogEntries (title, version, body, authorId, publishedAt)
select s.title, s.version, s.body, u.id, now() - (s.daysAgo || ' days')::interval
  from (values
    ('Faster writing, easier setup', '3.4', 'The editor now understands markdown as you type: ## makes a heading, - starts a list, and ``` opens a code block. Projects can be duplicated with their tasks and sections, so a template project is one click from a new client. Lists sort by due date as well as creation date.', 'maya@wishcairn.dev', 70),
    ('Mentions that reach you, history that stays', '3.5', 'When someone mentions you, we email you, batched to one message every ten minutes so a busy thread does not flood your inbox. Projects can be archived instead of deleted: they leave the sidebar but stay searchable, and anyone who could edit one can restore it.', 'theo@wishcairn.dev', 40),
    ('Drag, drop, and never miss a notification', '3.6', 'Drop files from your desktop onto any task to attach them, several at once. The browser tab now shows your unread notification count, so a pinned Loomwork tab tells you when something needs you.', 'maya@wishcairn.dev', 10)
  ) as s(title, version, body, email, daysAgo)
  join users u on u.email = s.email;

insert into changelogRequests (entryId, requestId)
select e.id, r.id
  from (values
    ('3.4', 'Markdown shortcuts in the editor'),
    ('3.4', 'Duplicate a project with its tasks'),
    ('3.4', 'Sort tasks by due date'),
    ('3.5', 'Email me when I am mentioned'),
    ('3.5', 'Archive instead of delete'),
    ('3.6', 'Attach files by drag and drop'),
    ('3.6', 'Unread count in the browser tab')
  ) as s(version, title)
  join changelogEntries e on e.version = s.version
  join requests r on r.title = s.title;

-- A shipped request shipped the day its release notes went out.
update requests r
   set statusChangedAt = e.publishedAt
  from changelogRequests cr
  join changelogEntries e on e.id = cr.entryId
 where cr.requestId = r.id;

-- The team's status changes, recorded in each thread.
insert into comments (requestId, userId, userName, isTeam, kind, body, createdAt)
select r.id, u.id, u.name, true, 'status', r.status::text, r.statusChangedAt
  from requests r
  join users u on u.email = case when abs(hashtext(r.title)) % 2 = 0 then 'maya@wishcairn.dev' else 'theo@wishcairn.dev' end
 where r.status <> 'under_review'
   and r.mergedIntoId is null;
