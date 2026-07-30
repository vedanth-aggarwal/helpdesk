export const TICKET_STATUS_LABELS: Record<"OPEN" | "RESOLVED" | "CLOSED", string> = {
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

export const SENDER_TYPE_LABELS: Record<"AGENT" | "CUSTOMER", string> = {
  AGENT: "Agent",
  CUSTOMER: "Customer",
};
