import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { TICKET_PAGE_SIZE, type TicketCategoryFilter, type TicketStatusFilter } from "@helpdesk/core";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { TICKET_STATUS_LABELS, TICKET_CATEGORY_LABELS } from "@/lib/ticketLabels";
import { TicketsTable, type TicketRow } from "@/components/TicketsTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketsResponse {
  tickets: TicketRow[];
  total: number;
}

const defaultSorting: SortingState = [{ id: "createdAt", desc: true }];

const ALL_STATUSES = "ALL_STATUSES" as const;
const ALL_CATEGORIES = "ALL_CATEGORIES" as const;

type StatusFilterValue = TicketStatusFilter | typeof ALL_STATUSES;
type CategoryFilterValue = TicketCategoryFilter | typeof ALL_CATEGORIES;

const statusLabels: Record<StatusFilterValue, string> = {
  [ALL_STATUSES]: "All statuses",
  ...TICKET_STATUS_LABELS,
};

const categoryLabels: Record<CategoryFilterValue, string> = {
  [ALL_CATEGORIES]: "All categories",
  ...TICKET_CATEGORY_LABELS,
  UNCATEGORIZED: "Uncategorized",
};

export function Tickets() {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);
  const [status, setStatus] = useState<StatusFilterValue>(ALL_STATUSES);
  const [category, setCategory] = useState<CategoryFilterValue>(ALL_CATEGORIES);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const activeSort = sorting[0] ?? defaultSorting[0];
  const sortBy = activeSort.id;
  const sortOrder = activeSort.desc ? "desc" : "asc";

  // Any change to sort/filters invalidates the current page — start back at page 1.
  useEffect(() => {
    setPage(1);
  }, [sortBy, sortOrder, status, category, search]);

  const { data, error } = useQuery({
    queryKey: ["tickets", sortBy, sortOrder, status, category, search, page],
    queryFn: async () => {
      const res = await api.get<TicketsResponse>("/api/tickets", {
        params: {
          sortBy,
          sortOrder,
          status: status === ALL_STATUSES ? undefined : status,
          category: category === ALL_CATEGORIES ? undefined : category,
          search: search || undefined,
          page,
        },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const tickets = data?.tickets;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / TICKET_PAGE_SIZE)) : 1;

  const errorMessage = getErrorMessage(error, "Failed to load tickets");

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-foreground">Tickets</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search subject or requester..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={(value) => setStatus(value as StatusFilterValue)}>
          <SelectTrigger aria-label="Status">
            <SelectValue>{(value: StatusFilterValue) => statusLabels[value]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(statusLabels) as StatusFilterValue[]).map((value) => (
              <SelectItem key={value} value={value}>
                {statusLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={category}
          onValueChange={(value) => setCategory(value as CategoryFilterValue)}
        >
          <SelectTrigger aria-label="Category">
            <SelectValue>{(value: CategoryFilterValue) => categoryLabels[value]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(categoryLabels) as CategoryFilterValue[]).map((value) => (
              <SelectItem key={value} value={value}>
                {categoryLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {errorMessage && <p className="mt-4 text-sm text-destructive">{errorMessage}</p>}

      {!errorMessage && (
        <>
          <TicketsTable tickets={tickets} sorting={sorting} onSortingChange={setSorting} />

          <div className="mt-4 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
