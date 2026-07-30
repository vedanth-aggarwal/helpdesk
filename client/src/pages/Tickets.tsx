import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { SortingState } from "@tanstack/react-table";
import type { TicketCategoryFilter, TicketStatusFilter } from "@helpdesk/core";
import { api } from "@/lib/api";
import { TicketsTable, type TicketRow } from "@/components/TicketsTable";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const defaultSorting: SortingState = [{ id: "createdAt", desc: true }];

const ALL_STATUSES = "ALL_STATUSES" as const;
const ALL_CATEGORIES = "ALL_CATEGORIES" as const;

type StatusFilterValue = TicketStatusFilter | typeof ALL_STATUSES;
type CategoryFilterValue = TicketCategoryFilter | typeof ALL_CATEGORIES;

const statusLabels: Record<StatusFilterValue, string> = {
  [ALL_STATUSES]: "All statuses",
  OPEN: "Open",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const categoryLabels: Record<CategoryFilterValue, string> = {
  [ALL_CATEGORIES]: "All categories",
  GENERAL_QUESTION: "General Question",
  TECHNICAL_QUESTION: "Technical Question",
  REFUND_REQUEST: "Refund Request",
  UNCATEGORIZED: "Uncategorized",
};

export function Tickets() {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);
  const [status, setStatus] = useState<StatusFilterValue>(ALL_STATUSES);
  const [category, setCategory] = useState<CategoryFilterValue>(ALL_CATEGORIES);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const activeSort = sorting[0] ?? defaultSorting[0];
  const sortBy = activeSort.id;
  const sortOrder = activeSort.desc ? "desc" : "asc";

  const { data: tickets, error } = useQuery({
    queryKey: ["tickets", sortBy, sortOrder, status, category, search],
    queryFn: async () => {
      const res = await api.get<TicketRow[]>("/api/tickets", {
        params: {
          sortBy,
          sortOrder,
          status: status === ALL_STATUSES ? undefined : status,
          category: category === ALL_CATEGORIES ? undefined : category,
          search: search || undefined,
        },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const errorMessage = error
    ? isAxiosError(error)
      ? error.response?.data?.error || error.message
      : "Failed to load tickets"
    : null;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">Tickets</h1>

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

      {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}

      {!errorMessage && (
        <TicketsTable tickets={tickets} sorting={sorting} onSortingChange={setSorting} />
      )}
    </div>
  );
}
