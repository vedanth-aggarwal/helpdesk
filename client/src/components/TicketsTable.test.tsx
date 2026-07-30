import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { SortingState } from "@tanstack/react-table";
import { TicketsTable, type TicketRow } from "./TicketsTable";

const tickets: TicketRow[] = [
  {
    id: 2,
    subject: "Refund request for order #4821",
    requesterEmail: "sam.rivera@example.com",
    requesterName: "Sam Rivera",
    status: "OPEN",
    category: "REFUND_REQUEST",
    assignee: { id: "agent-1", name: "Alex Kim", email: "alex@example.com" },
    createdAt: "2026-07-30T08:50:03.756Z",
  },
  {
    id: 1,
    subject: "Cannot log in",
    requesterEmail: "jane@example.com",
    requesterName: "Jane Doe",
    status: "OPEN",
    category: null,
    assignee: null,
    createdAt: "2026-07-30T08:48:27.663Z",
  },
];

const defaultSorting: SortingState = [{ id: "createdAt", desc: true }];

function renderTable(sorting: SortingState = defaultSorting, onSortingChange = vi.fn()) {
  return render(
    <MemoryRouter>
      <TicketsTable tickets={tickets} sorting={sorting} onSortingChange={onSortingChange} />
    </MemoryRouter>,
  );
}

describe("TicketsTable", () => {
  it("renders a skeleton row per placeholder while loading", () => {
    render(
      <MemoryRouter>
        <TicketsTable tickets={undefined} sorting={defaultSorting} onSortingChange={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("row")).toHaveLength(6); // header + 5 skeleton rows
  });

  it("renders a row per ticket with the expected cell content", () => {
    renderTable();

    expect(screen.getByText("Refund request for order #4821")).toBeInTheDocument();
    expect(screen.getByText("Sam Rivera")).toBeInTheDocument();
    expect(screen.getByText("sam.rivera@example.com")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2 ticket rows
  });

  it("renders the subject as a link to the ticket detail page", () => {
    renderTable();

    const link = screen.getByRole("link", { name: "Refund request for order #4821" });
    expect(link).toHaveAttribute("href", "/tickets/2");
  });

  it("renders a null category as Uncategorized", () => {
    renderTable();

    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
  });

  it("renders the assignee name, or Unassigned when there is none", () => {
    renderTable();

    expect(screen.getByText("Alex Kim")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("humanizes enum values for status and category", () => {
    renderTable();

    expect(screen.getAllByText("Open")).toHaveLength(2);
    expect(screen.getByText("Refund Request")).toBeInTheDocument();
  });

  it("renders sort indicator icons matching current sort state", () => {
    renderTable([{ id: "createdAt", desc: true }]);

    const createdHeader = screen.getByRole("button", { name: /created/i });
    expect(createdHeader.querySelector("svg")).toHaveClass("lucide-arrow-down");

    const subjectHeader = screen.getByRole("button", { name: /subject/i });
    expect(subjectHeader.querySelector("svg")).toHaveClass("lucide-arrow-up-down");
  });

  it("calls onSortingChange when a sortable header is clicked", async () => {
    const onSortingChange = vi.fn();
    renderTable(defaultSorting, onSortingChange);

    await userEvent.click(screen.getByRole("button", { name: /status/i }));

    expect(onSortingChange).toHaveBeenCalledTimes(1);
    const updater = onSortingChange.mock.calls[0][0];
    const nextState = typeof updater === "function" ? updater(defaultSorting) : updater;
    expect(nextState).toEqual([{ id: "status", desc: false }]);
  });
});
