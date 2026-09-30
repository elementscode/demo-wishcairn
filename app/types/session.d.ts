/**
 * The keys wishcairn stores in the session. `role` lets a template show the
 * team's controls reactively; every admin rpc still checks the users table.
 */
declare module "@elements/app" {
  interface SessionData {
    userId: string;
    userName: string;
    role: "customer" | "admin";
  }
}

export {};
