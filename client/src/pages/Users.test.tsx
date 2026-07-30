import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { Users } from "./Users";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);

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
    mockedPost.mockReset();
    mockedGet.mockResolvedValue({ data: users });
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

  it("opens the create user dialog from the Add user button", async () => {
    const user = userEvent.setup();
    renderUsers();

    await waitFor(() => {
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Add user" }));

    expect(screen.getByText("Create a new agent account. They'll be able to sign in with the email and password below.")).toBeInTheDocument();
  });

  it("shows validation errors for invalid input", async () => {
    const user = userEvent.setup();
    renderUsers();

    await waitFor(() => {
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Add user" }));
    await user.type(screen.getByLabelText("Name"), "Al");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(
      await screen.findByText("Name must be at least 3 characters"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("creates a user, closes the dialog, and refreshes the list", async () => {
    const user = userEvent.setup();
    mockedPost.mockResolvedValue({
      data: {
        id: "3",
        name: "New Agent",
        email: "new@example.com",
        role: "AGENT",
        createdAt: "2026-03-01T00:00:00.000Z",
      },
    });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Add user" }));
    await user.type(screen.getByLabelText("Name"), "New Agent");
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith("/api/users", {
        name: "New Agent",
        email: "new@example.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("shows a server error inline without closing the dialog", async () => {
    const user = userEvent.setup();
    mockedPost.mockRejectedValue(
      new AxiosError("Request failed", "409", undefined, undefined, {
        status: 409,
        statusText: "Conflict",
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: { error: "Email already in use" },
      }),
    );

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Add user" }));
    await user.type(screen.getByLabelText("Name"), "New Agent");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByText("Email already in use")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
