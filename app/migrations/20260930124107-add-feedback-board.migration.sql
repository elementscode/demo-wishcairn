-- add feedback board

-- Auto-update updatedAt on row changes.
create or replace function touchUpdatedAt()
returns trigger
language plpgsql
as $$
begin
  new.updatedAt = now();
  return new;
end;
$$;

-- A Date crosses the channel boundary as { $type, $value } so the browser
-- gets a Date back rather than a string.
create or replace function jsDate(t timestamptz)
returns json
language sql
immutable
as $$
  select case when t is null then null
         else json_build_object('$type', 'Date', '$value', (extract(epoch from t) * 1000)::bigint)
         end;
$$;

create type userRole as enum ('customer', 'admin');

create type requestStatus as enum ('under_review', 'planned', 'in_progress', 'shipped', 'closed');

create table users (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  email text not null unique,
  name text not null,
  passwordHash text not null,
  role userRole not null default 'customer'
);

create trigger usersTouchUpdatedAt
  before update on users
  for each row execute function touchUpdatedAt();

create table requests (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  title text not null,
  description text not null default '',
  status requestStatus not null default 'under_review',
  authorId uuid not null references users(id) on delete cascade,
  authorName text not null,
  voteCount integer not null default 0,
  commentCount integer not null default 0,
  mergedIntoId uuid references requests(id) on delete set null,
  statusChangedAt timestamptz not null default now()
);

create index requestsStatusIdx on requests (status);

create trigger requestsTouchUpdatedAt
  before update on requests
  for each row execute function touchUpdatedAt();

create table votes (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  requestId uuid not null references requests(id) on delete cascade,
  userId uuid not null references users(id) on delete cascade,
  unique (requestId, userId)
);

create index votesUserIdIdx on votes (userId);

create trigger votesTouchUpdatedAt
  before update on votes
  for each row execute function touchUpdatedAt();

-- kind 'comment' is a person talking; 'status' and 'merge' are the team's
-- actions, recorded in the thread so the history reads in one place.
create table comments (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  requestId uuid not null references requests(id) on delete cascade,
  userId uuid not null references users(id) on delete cascade,
  userName text not null,
  isTeam boolean not null default false,
  kind text not null default 'comment' check (kind in ('comment', 'status', 'merge')),
  body text not null
);

create index commentsRequestIdIdx on comments (requestId);

create trigger commentsTouchUpdatedAt
  before update on comments
  for each row execute function touchUpdatedAt();

create table changelogEntries (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  title text not null,
  body text not null,
  version text not null default '',
  authorId uuid not null references users(id) on delete cascade,
  publishedAt timestamptz not null default now()
);

create trigger changelogEntriesTouchUpdatedAt
  before update on changelogEntries
  for each row execute function touchUpdatedAt();

create table changelogRequests (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  entryId uuid not null references changelogEntries(id) on delete cascade,
  requestId uuid not null references requests(id) on delete cascade,
  unique (entryId, requestId)
);

create trigger changelogRequestsTouchUpdatedAt
  before update on changelogRequests
  for each row execute function touchUpdatedAt();

-- Denormalized counts, kept by the database so every write path agrees.
create or replace function votesCount() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update requests set voteCount = voteCount + 1 where id = new.requestId;
  elsif tg_op = 'DELETE' then
    update requests set voteCount = greatest(voteCount - 1, 0) where id = old.requestId;
  end if;

  return null;
end;
$$;

create trigger votesCountTrigger
  after insert or delete on votes
  for each row execute function votesCount();

create or replace function commentsCount() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.kind = 'comment' then
    update requests set commentCount = commentCount + 1 where id = new.requestId;
  elsif tg_op = 'DELETE' and old.kind = 'comment' then
    update requests set commentCount = greatest(commentCount - 1, 0) where id = old.requestId;
  end if;

  return null;
end;
$$;

create trigger commentsCountTrigger
  after insert or delete on comments
  for each row execute function commentsCount();

-- Every write to these tables reaches open pages, whether it came through a
-- LiveView, an rpc, a job, or psql.
create or replace function requestsNotify() returns trigger
language plpgsql as $$
declare
  r requests;
  payload text;
begin
  r := coalesce(new, old);

  payload := json_build_object(
    'op', lower(tg_op),
    'data', json_build_object(
      'id', r.id,
      'createdAt', jsDate(r.createdAt),
      'updatedAt', jsDate(r.updatedAt),
      'title', r.title,
      'description', r.description,
      'status', r.status,
      'authorId', r.authorId,
      'authorName', r.authorName,
      'voteCount', r.voteCount,
      'commentCount', r.commentCount,
      'mergedIntoId', r.mergedIntoId,
      'statusChangedAt', jsDate(r.statusChangedAt)
    )
  )::text;

  if octet_length(payload) >= 8000 then
    payload := json_build_object('op', lower(tg_op), 'id', r.id)::text;
  end if;

  perform pg_notify(channel_name('requests'), payload);

  return null;
end;
$$;

create trigger requestsNotifyTrigger
  after insert or update or delete on requests
  for each row execute function requestsNotify();

create or replace function votesNotify() returns trigger
language plpgsql as $$
declare
  r votes;
begin
  r := coalesce(new, old);

  perform pg_notify(
    channel_name('votes'),
    json_build_object(
      'op', lower(tg_op),
      'data', json_build_object('id', r.id, 'requestId', r.requestId, 'userId', r.userId)
    )::text
  );

  return null;
end;
$$;

create trigger votesNotifyTrigger
  after insert or delete on votes
  for each row execute function votesNotify();

create or replace function commentsNotify() returns trigger
language plpgsql as $$
declare
  r comments;
  payload text;
begin
  r := coalesce(new, old);

  payload := json_build_object(
    'op', lower(tg_op),
    'data', json_build_object(
      'id', r.id,
      'createdAt', jsDate(r.createdAt),
      'requestId', r.requestId,
      'userId', r.userId,
      'userName', r.userName,
      'isTeam', r.isTeam,
      'kind', r.kind,
      'body', r.body
    )
  )::text;

  if octet_length(payload) >= 8000 then
    payload := json_build_object('op', lower(tg_op), 'id', r.id)::text;
  end if;

  perform pg_notify(channel_name('comments'), payload);

  return null;
end;
$$;

create trigger commentsNotifyTrigger
  after insert or update or delete on comments
  for each row execute function commentsNotify();
