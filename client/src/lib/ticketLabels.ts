export const TICKET_STATUS_LABELS: Record<
  "NEW" | "PROCESSING" | "OPEN" | "RESOLVED" | "CLOSED",
  string
> = {
  NEW: "New",
  PROCESSING: "Processing…",
  OPEN: "Open",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const TICKET_CATEGORY_LABELS: Record<
  "GENERAL_QUESTION" | "TECHNICAL_QUESTION" | "REFUND_REQUEST",
  string
> = {
  GENERAL_QUESTION: "General Question",
  TECHNICAL_QUESTION: "Technical Question",
  REFUND_REQUEST: "Refund Request",
};

export const SENDER_TYPE_LABELS: Record<"AGENT" | "CUSTOMER" | "AI", string> = {
  AGENT: "Agent",
  CUSTOMER: "Customer",
  AI: "AI Assistant",
};

export const TICKET_STATUS_COLORS: Record<
  "NEW" | "PROCESSING" | "OPEN" | "RESOLVED" | "CLOSED",
  string
> = {
  NEW: "bg-status-ai/15 text-status-ai border-status-ai/30",
  PROCESSING: "bg-status-ai/15 text-status-ai border-status-ai/30",
  OPEN: "bg-status-open/15 text-status-open border-status-open/30",
  RESOLVED: "bg-status-resolved/15 text-status-resolved border-status-resolved/30",
  CLOSED: "bg-status-closed/15 text-status-closed border-status-closed/30",
};

export const SENDER_TYPE_COLORS: Record<"AGENT" | "CUSTOMER" | "AI", string> = {
  AGENT: "bg-primary/15 text-primary border-primary/30",
  CUSTOMER: "bg-muted text-muted-foreground border-border",
  AI: "bg-status-ai/15 text-status-ai border-status-ai/30",
};
