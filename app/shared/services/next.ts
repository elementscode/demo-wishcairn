/** Only a same-site path survives, so ?next= cannot send anyone off the site. */
export function safeNext(next: string | undefined | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }

  return next;
}
