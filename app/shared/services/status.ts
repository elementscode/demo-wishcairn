export type Status = "under_review" | "planned" | "in_progress" | "shipped" | "closed";

export const STATUSES: Status[] = ["under_review", "planned", "in_progress", "shipped", "closed"];

export const STATUS_LABELS: Record<Status, string> = {
  under_review: "Under review",
  planned: "Planned",
  in_progress: "In progress",
  shipped: "Shipped",
  closed: "Closed",
};

export type StatusVariant = "outline" | "info" | "warning" | "success" | "secondary";

const STATUS_VARIANTS: Record<Status, StatusVariant> = {
  under_review: "outline",
  planned: "info",
  in_progress: "warning",
  shipped: "success",
  closed: "secondary",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as Status] ?? status;
}

export function statusVariant(status: string): StatusVariant {
  return STATUS_VARIANTS[status as Status] ?? "outline";
}

export function isStatus(value: string): value is Status {
  return STATUSES.includes(value as Status);
}
