import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { Tickets } from "./Tickets";
import { api } from "@/lib/api";
import { renderWithQuery } from "@/test/renderWithQuery";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn() },
}));

const mockedGet = vi.mocked(api.get);

function renderTickets() {
  return renderWithQuery(<Tickets />);
}

const tickets = [
  {
    id: 2,
    subject: "Refund request for order #4821",
    requesterEmail: "sam.rivera@example.com",
    requesterName: "Sam Rivera",
    status: "OPEN" as const,
    category: "REFUND_REQUEST" as const,
    createdAt: "2026-07-30T08:50:03.756Z",
  },
  {
    id: 1,
    subject: "Cannot log in",
    requesterEmail: "jane@example.com",
    requesterName: "Jane Doe",
    status: "OPEN" as const,
    category: null,
    createdAt: "2026-07-30T08:48:27.663Z",
  },
];

describe("Tickets", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedGet.mockResolvedValue({ data: tickets });
  });

  it("renders a loading skeleton before data resolves", () => {
    mockedGet.mockReturnValue(new Promise(() => {}));

    renderTickets();

    expect(screen.getByText("Tickets")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(6); // header + 5 skeleton rows
    expect(screen.queryByText("Cannot log in")).not.toBeInTheDocument();
  });

  it("renders a row per ticket once data loads, in the order the API returned", async () => {
    renderTickets();

    await waitFor(() => {
      expect(screen.getByText("Refund request for order #4821")).toBeInTheDocument();
    });

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3); // header + 2 ticket rows
    expect(rows[1]).toHaveTextContent("Refund request for order #4821");
    expect(rows[2]).toHaveTextContent("Cannot log in");
  });

  it("requests the default sort (createdAt desc) on initial render", async () => {
    renderTickets();

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith("/api/tickets", {
        params: { sortBy: "createdAt", sortOrder: "desc" },
      });
    });
  });

  it("refetches with the new sort params when a sortable column header is clicked", async () => {
    renderTickets();

    await waitFor(() => {
      expect(screen.getByText("Refund request for order #4821")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /subject/i }));

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith("/api/tickets", {
        params: { sortBy: "subject", sortOrder: "asc" },
      });
    });
  });

  it("flips sortOrder to desc when clicking the currently-sorted column again", async () => {
    renderTickets();

    await waitFor(() => {
      expect(screen.getByText("Refund request for order #4821")).toBeInTheDocument();
    });

    const subjectHeader = screen.getByRole("button", { name: /subject/i });
    await userEvent.click(subjectHeader);
    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith("/api/tickets", {
        params: { sortBy: "subject", sortOrder: "asc" },
      });
    });

    await userEvent.click(subjectHeader);
    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith("/api/tickets", {
        params: { sortBy: "subject", sortOrder: "desc" },
      });
    });
  });

  it("refetches with a status filter when a status is selected", async () => {
    renderTickets();

    await waitFor(() => {
      expect(screen.getByText("Refund request for order #4821")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("combobox", { name: "Status" }));
    await userEvent.click(await screen.findByRole("option", { name: "Resolved" }));

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith("/api/tickets", {
        params: { sortBy: "createdAt", sortOrder: "desc", status: "RESOLVED" },
      });
    });
  });

  it("refetches with a category filter when a category is selected", async () => {
    renderTickets();

    await waitFor(() => {
      expect(screen.getByText("Refund request for order #4821")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("combobox", { name: "Category" }));
    await userEvent.click(await screen.findByRole("option", { name: "Uncategorized" }));

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith("/api/tickets", {
        params: { sortBy: "createdAt", sortOrder: "desc", category: "UNCATEGORIZED" },
      });
    });
  });

  it("refetches with a debounced search param after typing", async () => {
    renderTickets();

    await waitFor(() => {
      expect(screen.getByText("Refund request for order #4821")).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText(/search subject or requester/i), "sam");

    // Debounce: no immediate call with the search param.
    expect(mockedGet).not.toHaveBeenCalledWith(
      "/api/tickets",
      expect.objectContaining({ params: expect.objectContaining({ search: "sam" }) }),
    );

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith("/api/tickets", {
        params: { sortBy: "createdAt", sortOrder: "desc", search: "sam" },
      });
    });
  });

  it("renders the server error message on failure", async () => {
    mockedGet.mockRejectedValue(
      new AxiosError("Request failed", "401", undefined, undefined, {
        status: 401,
        statusText: "Unauthorized",
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: { error: "Unauthorized" },
      }),
    );

    renderTickets();

    await waitFor(() => {
      expect(screen.getByText("Unauthorized")).toBeInTheDocument();
    });

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("falls back to a generic message for non-axios errors", async () => {
    mockedGet.mockRejectedValue(new Error("boom"));

    renderTickets();

    await waitFor(() => {
      expect(screen.getByText("Failed to load tickets")).toBeInTheDocument();
    });
  });
});
