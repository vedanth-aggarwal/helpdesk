import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type OnChangeFn,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import type { TicketCategory, TicketStatusFilter } from "@helpdesk/core";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TICKET_STATUS_LABELS, TICKET_CATEGORY_LABELS } from "@/lib/ticketLabels";

export interface TicketRow {
  id: number;
  subject: string;
  requesterEmail: string;
  requesterName: string;
  status: TicketStatusFilter;
  category: TicketCategory | null;
  assignee: { id: string; name: string; email: string } | null;
  createdAt: string;
}

interface TicketsTableProps {
  tickets: TicketRow[] | undefined;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
}

const columnHelper = createColumnHelper<TicketRow>();

const columns = [
  columnHelper.accessor("subject", {
    header: "Subject",
    cell: (info) => (
      <Link
        to={`/tickets/${info.row.original.id}`}
        className="font-medium text-gray-900 hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("requesterName", {
    header: "Requester",
    enableSorting: true,
    cell: (info) => (
      <>
        <div>{info.getValue()}</div>
        <div className="text-sm text-muted-foreground">{info.row.original.requesterEmail}</div>
      </>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => TICKET_STATUS_LABELS[info.getValue()],
  }),
  columnHelper.accessor("category", {
    header: "Category",
    cell: (info) => {
      const category = info.getValue();
      return category ? TICKET_CATEGORY_LABELS[category] : "Uncategorized";
    },
  }),
  columnHelper.accessor((row) => row.assignee?.name ?? "Unassigned", {
    id: "assignee",
    header: "Assigned to",
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
];

export function TicketsTable({ tickets, sorting, onSortingChange }: TicketsTableProps) {
  const table = useReactTable({
    data: tickets ?? [],
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!tickets) {
    return (
      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Requester</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Assigned to</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table className="mt-4">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const canSort = header.column.getCanSort();
              const sortDirection = header.column.getIsSorted();
              const SortIcon =
                sortDirection === "asc" ? ArrowUp : sortDirection === "desc" ? ArrowDown : ArrowUpDown;

              return (
                <TableHead key={header.id}>
                  {canSort ? (
                    <button
                      type="button"
                      className="flex items-center gap-1"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <SortIcon className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
