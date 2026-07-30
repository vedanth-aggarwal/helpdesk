import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { api } from "@/lib/api";
import { renderWithQuery } from "@/test/renderWithQuery";
import type { UserRow } from "@/components/UsersTable";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), delete: vi.fn() },
}));

const mockedDelete = vi.mocked(api.delete);

const user: UserRow = {
  id: "1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "AGENT",
  createdAt: "2026-01-15T00:00:00.000Z",
};

function renderDialog(deletingUser: UserRow | null = user) {
  const onOpenChange = vi.fn();
  const utils = renderWithQuery(
    <DeleteUserDialog user={deletingUser} onOpenChange={onOpenChange} />,
  );
  return { onOpenChange, ...utils };
}

describe("DeleteUserDialog", () => {
  beforeEach(() => {
    mockedDelete.mockReset();
  });

  it("does not render the dialog when there is no user to delete", () => {
    renderDialog(null);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("renders the user's name in the confirmation copy", () => {
    renderDialog();

    expect(screen.getByText("Delete Ada Lovelace?")).toBeInTheDocument();
  });

  it("closes without deleting when Cancel is clicked", async () => {
    const userEventInstance = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await userEventInstance.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockedDelete).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("deletes the user, closes, and refreshes the list on confirm", async () => {
    const userEventInstance = userEvent.setup();
    mockedDelete.mockResolvedValue({ data: undefined });
    const { onOpenChange } = renderDialog();

    await userEventInstance.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockedDelete).toHaveBeenCalledWith("/api/users/1");
    });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("shows a server error inline and keeps the dialog open", async () => {
    const userEventInstance = userEvent.setup();
    mockedDelete.mockRejectedValue(
      new AxiosError("Request failed", "403", undefined, undefined, {
        status: 403,
        statusText: "Forbidden",
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: { error: "Admin users cannot be deleted" },
      }),
    );
    const { onOpenChange } = renderDialog();

    await userEventInstance.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText("Admin users cannot be deleted"),
    ).toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("falls back to a generic message for a non-axios error", async () => {
    const userEventInstance = userEvent.setup();
    mockedDelete.mockRejectedValue(new Error("network down"));
    renderDialog();

    await userEventInstance.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Failed to delete user")).toBeInTheDocument();
  });

  it("disables the buttons and shows a pending label while deleting", async () => {
    const userEventInstance = userEvent.setup();
    let resolveDelete: (value: unknown) => void = () => {};
    mockedDelete.mockReturnValue(
      new Promise((resolve) => {
        resolveDelete = resolve;
      }),
    );
    renderDialog();

    await userEventInstance.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("button", { name: "Deleting…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    resolveDelete({ data: undefined });
  });
});
