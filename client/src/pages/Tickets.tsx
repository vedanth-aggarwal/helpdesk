import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { SortingState } from "@tanstack/react-table";
import { api } from "@/lib/api";
import { TicketsTable, type TicketRow } from "@/components/TicketsTable";

const defaultSorting: SortingState = [{ id: "createdAt", desc: true }];

export function Tickets() {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);

  const activeSort = sorting[0] ?? defaultSorting[0];
  const sortBy = activeSort.id;
  const sortOrder = activeSort.desc ? "desc" : "asc";

  const { data: tickets, error } = useQuery({
    queryKey: ["tickets", sortBy, sortOrder],
    queryFn: async () => {
      const res = await api.get<TicketRow[]>("/api/tickets", { params: { sortBy, sortOrder } });
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

      {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}

      {!errorMessage && (
        <TicketsTable tickets={tickets} sorting={sorting} onSortingChange={setSorting} />
      )}
    </div>
  );
}
