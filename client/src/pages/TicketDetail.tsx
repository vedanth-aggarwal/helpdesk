import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { TICKET_STATUS_LABELS, TICKET_CATEGORY_LABELS } from "@/lib/ticketLabels";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Agent {
  id: string;
  name: string;
  email: string;
}

type TicketStatus = "OPEN" | "RESOLVED" | "CLOSED";
type TicketCategory = "GENERAL_QUESTION" | "TECHNICAL_QUESTION" | "REFUND_REQUEST";

interface TicketDetailResponse {
  id: number;
  subject: string;
  body: string;
  requesterEmail: string;
  requesterName: string;
  status: TicketStatus;
  category: TicketCategory | null;
  assignee: Agent | null;
  messageId: string | null;
  createdAt: string;
  updatedAt: string;
}

const UNASSIGNED = "UNASSIGNED" as const;
const UNCATEGORIZED = "UNCATEGORIZED" as const;

const statusOptions: TicketStatus[] = ["OPEN", "RESOLVED", "CLOSED"];
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
    mutationFn: async (data: { status?: TicketStatus; category?: TicketCategory | null }) => {
      const res = await api.patch(`/api/tickets/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const errorMessage = error
    ? isAxiosError(error)
      ? error.response?.data?.error || error.message
      : "Failed to load ticket"
    : null;

  const assignErrorMessage = assignMutation.error
    ? isAxiosError(assignMutation.error)
      ? assignMutation.error.response?.data?.error || assignMutation.error.message
      : "Failed to update assignment"
    : null;

  const updateErrorMessage = updateMutation.error
    ? isAxiosError(updateMutation.error)
      ? updateMutation.error.response?.data?.error || updateMutation.error.message
      : "Failed to update ticket"
    : null;

  return (
    <div className="p-6">
      <Link to="/tickets" className="text-sm text-gray-600 hover:text-gray-900">
        &larr; Back to tickets
      </Link>

      {isLoading && (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-6 w-72" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}

      {ticket && (
        <>
          <h1 className="mt-2 text-xl font-semibold text-gray-900">{ticket.subject}</h1>
          <div className="mt-2 text-sm text-muted-foreground">
            {ticket.requesterName} &lt;{ticket.requesterEmail}&gt;
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              Status:{" "}
              <Select
                value={ticket.status}
                onValueChange={(value) => updateMutation.mutate({ status: value as TicketStatus })}
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
            <p className="mt-2 text-sm text-red-600">{assignErrorMessage}</p>
          )}
          {updateErrorMessage && (
            <p className="mt-2 text-sm text-red-600">{updateErrorMessage}</p>
          )}

          <div className="mt-6 whitespace-pre-wrap rounded-md border border-gray-200 bg-white p-4 text-sm">
            {ticket.body}
          </div>
        </>
      )}
    </div>
  );
}
