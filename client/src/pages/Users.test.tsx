import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { Users } from "./Users";
import { api } from "@/lib/api";
import { renderWithQuery } from "@/test/renderWithQuery";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);
const mockedPatch = vi.mocked(api.patch);
const mockedDelete = vi.mocked(api.delete);

function renderUsers() {
  return renderWithQuery(<Users />);
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
    mockedPatch.mockReset();
    mockedDelete.mockReset();
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

  it("closes the create user dialog when Escape is pressed", async () => {
    const user = userEvent.setup();
    renderUsers();

    await waitFor(() => {
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Add user" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes the create user dialog when clicking outside", async () => {
    const user = userEvent.setup();
    renderUsers();

    await waitFor(() => {
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Add user" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).not.toBeNull();
    await user.click(overlay as Element);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
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

  it("edits a user from the row's edit button, prefilled with their data", async () => {
    const user = userEvent.setup();
    mockedPatch.mockResolvedValue({
      data: { ...users[0], name: "Ada Byron" },
    });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Edit Ada Lovelace" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Edit user")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Ada Lovelace");
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("");

    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Ada Byron");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith("/api/users/1", {
        name: "Ada Byron",
        email: "ada@example.com",
        password: "",
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("has a disabled delete button for the admin row", async () => {
    renderUsers();

    await waitFor(() => {
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Delete Ada Lovelace" })).toBeDisabled();
  });

  it("deletes a user from the row's delete button after confirming", async () => {
    const user = userEvent.setup();
    mockedDelete.mockResolvedValue({ data: undefined });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Delete Grace Hopper" }));

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Delete Grace Hopper?")).toBeInTheDocument();

    mockedGet.mockResolvedValue({ data: [users[0]] });
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockedDelete).toHaveBeenCalledWith("/api/users/2");
    });

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText("Grace Hopper")).not.toBeInTheDocument();
    });
  });
});
