import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Inbox, Percent, Sparkles, Timer, type LucideIcon } from "lucide-react";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketsPerDayChart } from "@/components/TicketsPerDayChart";

interface TicketStats {
  total: number;
  open: number;
  resolvedByAi: number;
  avgResolutionSeconds: number | null;
  ticketsPerDay: { date: string; count: number }[];
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: LucideIcon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="font-mono text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

export function Home() {
  const { data: stats, error, isLoading } = useQuery({
    queryKey: ["tickets", "stats"],
    queryFn: async () => {
      const res = await api.get<TicketStats>("/api/tickets/stats");
      return res.data;
    },
  });

  const errorMessage = getErrorMessage(error, "Failed to load dashboard stats");

  const resolvedByAiPercent =
    stats && stats.total > 0 ? `${((stats.resolvedByAi / stats.total) * 100).toFixed(1)}%` : "—";

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>

      {isLoading && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {errorMessage && <p className="mt-4 text-sm text-destructive">{errorMessage}</p>}

      {stats && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total Tickets" value={stats.total.toLocaleString()} icon={Inbox} />
          <StatCard title="Open Tickets" value={stats.open.toLocaleString()} icon={AlertCircle} />
          <StatCard
            title="Resolved by AI"
            value={stats.resolvedByAi.toLocaleString()}
            icon={Sparkles}
          />
          <StatCard title="% Resolved by AI" value={resolvedByAiPercent} icon={Percent} />
          <StatCard
            title="Avg. Resolution Time"
            value={
              stats.avgResolutionSeconds !== null
                ? formatDuration(stats.avgResolutionSeconds)
                : "—"
            }
            icon={Timer}
          />
        </div>
      )}

      {stats && (
        <div className="mt-4">
          <TicketsPerDayChart data={stats.ticketsPerDay} />
        </div>
      )}
    </div>
  );
}
