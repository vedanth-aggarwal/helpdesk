import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { Users } from "./Users";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn() },
}));

const mockedGet = vi.mocked(api.get);

function renderUsers() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Users />
    </QueryClientProvider>,
  );
}

const users = [
  {
    id: "1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    role: "ADMIN" as const,
    createdAt: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Grace Hopper",
    email: "grace@example.com",
    role: "AGENT" as const,
    createdAt: "2026-02-20T00:00:00.000Z",
  },
];

describe("Users", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("renders a loading skeleton before data resolves", () => {
    mockedGet.mockReturnValue(new Promise(() => {}));

    renderUsers();

    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(6); // header + 5 skeleton rows
    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
  });

  it("renders a row per user once data loads", async () => {
    mockedGet.mockResolvedValue({ data: users });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });

    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByText("grace@example.com")).toBeInTheDocument();
    expect(screen.getByText("AGENT")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2 user rows
  });

  it("renders the server error message on failure", async () => {
    mockedGet.mockRejectedValue(
      new AxiosError(
        "Request failed",
        "403",
        undefined,
        undefined,
        {
          status: 403,
          statusText: "Forbidden",
          headers: new AxiosHeaders(),
          config: { headers: new AxiosHeaders() },
          data: { error: "Admins only" },
        },
      ),
    );

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText("Admins only")).toBeInTheDocument();
    });

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("falls back to a generic message for non-axios errors", async () => {
    mockedGet.mockRejectedValue(new Error("boom"));

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText("Failed to load users")).toBeInTheDocument();
    });
  });
});
