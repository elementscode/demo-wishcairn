import { sql, session, AuthError, ForbiddenError } from "@elements/app";

interface SignedInUser {
  id: string;
  name: string;
  role: "customer" | "admin";
}

export const MIN_PASSWORD = 8;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export function isUserAdmin(userId: string): boolean {
  return !sql(`select 1 from users where id = ${userId} and role = 'admin'`).empty();
}

export function isUserAdminOrThrow() {
  session.isLoggedInOrThrow();

  if (!isUserAdmin(session.getOrThrow("userId"))) {
    throw new ForbiddenError("team access required");
  }
}

/** @rpc */
export function signin(email: string, password: string) {
  let address = normalizeEmail(email);

  if (!address || !password) {
    throw new AuthError("Enter your email and password.");
  }

  let user = sql<SignedInUser>(`
    select id, name, role from users
     where email = ${address}
       and passwordHash = crypt(${password}, passwordHash)
  `).first();

  if (!user) {
    throw new AuthError("That email and password do not match.");
  }

  session.login({ userId: user.id, userName: user.name, role: user.role });
}

/** @rpc */
export function signup(name: string, email: string, password: string) {
  let displayName = name.trim();
  let address = normalizeEmail(email);

  if (!displayName) {
    throw new AuthError("Enter your name.");
  }

  if (!isEmail(address)) {
    throw new AuthError("Enter a valid email address.");
  }

  if (password.length < MIN_PASSWORD) {
    throw new AuthError(`Your password needs at least ${MIN_PASSWORD} characters.`);
  }

  if (!sql(`select 1 from users where email = ${address}`).empty()) {
    throw new AuthError("That email is already registered. Sign in instead.");
  }

  let user = sql<{ id: string }>(`
    insert into users (name, email, passwordHash)
         values (${displayName}, ${address}, crypt(${password}, genSalt('bf', 12)))
      returning id
  `).firstOrThrow();

  session.login({ userId: user.id, userName: displayName, role: "customer" });
}

/** @rpc */
export function signout() {
  session.logout();
}
