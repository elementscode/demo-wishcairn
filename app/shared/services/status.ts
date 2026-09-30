export type Status = "under_review" | "planned" | "in_progress" | "shipped" | "closed";

export const STATUSES: Status[] = ["under_review", "planned", "in_progress", "shipped", "closed"];

export const STATUS_LABELS: Record<Status, string> = {
  under_review: "Under review",
  planned: "Planned",
  in_progress: "In progress",
  shipped: "Shipped",
  closed: "Closed",
};

const STATUS_PILLS: Record<Status, string> = {
  under_review: "",
  planned: "is-info",
  in_progress: "is-warning",
  shipped: "is-success",
  closed: "is-closed",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as Status] ?? status;
}

export function statusPill(status: string): string {
  return STATUS_PILLS[status as Status] ?? "";
}

export function isStatus(value: string): value is Status {
  return STATUSES.includes(value as Status);
}
