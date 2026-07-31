import { Badge } from "@/components/ui/badge";
import { SENDER_TYPE_COLORS, SENDER_TYPE_LABELS } from "@/lib/ticketLabels";

interface SenderBadgeProps {
  senderType: keyof typeof SENDER_TYPE_LABELS;
}

export function SenderBadge({ senderType }: SenderBadgeProps) {
  return (
    <Badge variant="outline" className={SENDER_TYPE_COLORS[senderType]}>
      {SENDER_TYPE_LABELS[senderType]}
    </Badge>
  );
}
