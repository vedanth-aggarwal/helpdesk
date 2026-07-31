import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TicketCategory, TicketStatusFilter } from "@helpdesk/core";
import { Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { authClient } from "@/lib/auth-client";
import { TICKET_STATUS_LABELS, TICKET_CATEGORY_LABELS } from "@/lib/ticketLabels";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReplyForm } from "@/components/ReplyForm";
import { StatusBadge } from "@/components/StatusBadge";
import { SenderBadge } from "@/components/SenderBadge";

interface Agent {
  id: string;
  name: string;
  email: string;
}

type TicketStatusDisplay = TicketStatusFilter | "NEW" | "PROCESSING";

interface TicketDetailResponse {
  id: number;
  subject: string;
  body: string;
  requesterEmail: string;
  requesterName: string;
  status: TicketStatusDisplay;
  category: TicketCategory | null;
  assignee: Agent | null;
  messageId: string | null;
  createdAt: string;
  updatedAt: string;
}

type SenderType = "AGENT" | "CUSTOMER" | "AI";

interface Reply {
  id: number;
  body: string;
  senderType: SenderType;
  createdAt: string;
  author: { id: string; name: string } | null;
}

const UNASSIGNED = "UNASSIGNED" as const;
const UNCATEGORIZED = "UNCATEGORIZED" as const;

const statusOptions: TicketStatusFilter[] = ["OPEN", "RESOLVED", "CLOSED"];
const categoryOptions: TicketCategory[] = [
  "GENERAL_QUESTION",
  "TECHNICAL_QUESTION",
  "REFUND_REQUEST",
];

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user.role === "ADMIN";
  const queryClient = useQueryClient();

  const { data: ticket, error, isLoading } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const res = await api.get<TicketDetailResponse>(`/api/tickets/${id}`);
      return res.data;
    },
  });

  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await api.get<Agent[]>("/api/agents");
      return res.data;
    },
    enabled: isAdmin,
  });

  const { data: replies } = useQuery({
    queryKey: ["ticket", id, "replies"],
    queryFn: async () => {
      const res = await api.get<Reply[]>(`/api/tickets/${id}/replies`);
      return res.data;
    },
    enabled: !!ticket,
  });

  const assignMutation = useMutation({
    mutationFn: async (assigneeId: string | null) => {
      const res = await api.patch(`/api/tickets/${id}/assign`, { assigneeId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { status?: TicketStatusFilter; category?: TicketCategory | null }) => {
      const res = await api.patch(`/api/tickets/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const summarizeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ summary: string }>(`/api/tickets/${id}/summarize`);
      return res.data;
    },
  });

  const errorMessage = getErrorMessage(error, "Failed to load ticket");
  const assignErrorMessage = getErrorMessage(assignMutation.error, "Failed to update assignment");
  const updateErrorMessage = getErrorMessage(updateMutation.error, "Failed to update ticket");
  const summarizeErrorMessage = getErrorMessage(summarizeMutation.error, "Failed to summarize ticket");

  return (
    <div className="p-6">
      <Link to="/tickets" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Back to tickets
      </Link>

      {isLoading && (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-6 w-72" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {errorMessage && <p className="mt-4 text-sm text-destructive">{errorMessage}</p>}

      {ticket && (
        <>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              #{ticket.id.toString().padStart(4, "0")}
            </span>
            <StatusBadge status={ticket.status} />
          </div>
          <h1 className="mt-1 text-xl font-semibold text-foreground">{ticket.subject}</h1>
          <div className="mt-2 text-sm text-muted-foreground">
            {ticket.requesterName} &lt;{ticket.requesterEmail}&gt;
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              Status:{" "}
              <Select
                value={ticket.status}
                onValueChange={(value) =>
                  updateMutation.mutate({ status: value as TicketStatusFilter })
                }
              >
                <SelectTrigger aria-label="Status" className="h-7 w-36">
                  <SelectValue>{() => TICKET_STATUS_LABELS[ticket.status]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {TICKET_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </span>
            <span className="flex items-center gap-1">
              Category:{" "}
              <Select
                value={ticket.category ?? UNCATEGORIZED}
                onValueChange={(value) =>
                  updateMutation.mutate({
                    category: value === UNCATEGORIZED ? null : (value as TicketCategory),
                  })
                }
              >
                <SelectTrigger aria-label="Category" className="h-7 w-48">
                  <SelectValue>
                    {() =>
                      ticket.category ? TICKET_CATEGORY_LABELS[ticket.category] : "Uncategorized"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNCATEGORIZED}>Uncategorized</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {TICKET_CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </span>
            <span className="flex items-center gap-1">
              Assigned to:{" "}
              {isAdmin ? (
                <Select
                  value={ticket.assignee?.id ?? UNASSIGNED}
                  onValueChange={(value) =>
                    assignMutation.mutate(value === UNASSIGNED ? null : value)
                  }
                >
                  <SelectTrigger aria-label="Assigned to" className="h-7 w-48">
                    <SelectValue>
                      {(value: string) =>
                        value === UNASSIGNED
                          ? "Unassigned"
                          : (agents?.find((agent) => agent.id === value)?.name ??
                            ticket.assignee?.name ??
                            "Unassigned")
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                    {agents?.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span>{ticket.assignee?.name ?? "Unassigned"}</span>
              )}
            </span>
            <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
          </div>

          {assignErrorMessage && (
            <p className="mt-2 text-sm text-destructive">{assignErrorMessage}</p>
          )}
          {updateErrorMessage && (
            <p className="mt-2 text-sm text-destructive">{updateErrorMessage}</p>
          )}

          <div className="mt-6 whitespace-pre-wrap rounded-md border border-border bg-card p-4 text-sm">
            {ticket.body}
          </div>

          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={summarizeMutation.isPending}
              onClick={() => summarizeMutation.mutate()}
            >
              <Sparkles />
              {summarizeMutation.isPending ? "Summarizing…" : "Summarize"}
            </Button>
            {summarizeErrorMessage && (
              <p className="mt-2 text-sm text-destructive">{summarizeErrorMessage}</p>
            )}
            {summarizeMutation.data && (
              <div className="mt-2 rounded-md border border-border bg-muted p-4 text-sm">
                {summarizeMutation.data.summary}
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Replies</h2>
            {replies?.length === 0 && (
              <p className="text-sm text-muted-foreground">No replies yet.</p>
            )}
            {replies?.map((reply) => (
              <div
                key={reply.id}
                className="whitespace-pre-wrap rounded-md border border-border bg-card p-4 text-sm"
              >
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {reply.author?.name ?? "AI Assistant"}
                  </span>
                  <SenderBadge senderType={reply.senderType} />
                  <span>{new Date(reply.createdAt).toLocaleString()}</span>
                </div>
                <div>{reply.body}</div>
              </div>
            ))}
          </div>

          <ReplyForm ticketId={id!} />
        </>
      )}
    </div>
  );
}
