import { Badge } from "@/components/ui/badge";
import { TICKET_STATUS_COLORS, TICKET_STATUS_LABELS } from "@/lib/ticketLabels";

interface StatusBadgeProps {
  status: keyof typeof TICKET_STATUS_LABELS;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={TICKET_STATUS_COLORS[status]}>
      {TICKET_STATUS_LABELS[status]}
    </Badge>
  );
}
