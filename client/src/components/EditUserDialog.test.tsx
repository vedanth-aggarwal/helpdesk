import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { EditUserDialog } from "./EditUserDialog";
import { api } from "@/lib/api";
import { renderWithQuery } from "@/test/renderWithQuery";
import type { UserRow } from "@/components/UsersTable";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), patch: vi.fn() },
}));

const mockedPatch = vi.mocked(api.patch);

const user: UserRow = {
  id: "1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "AGENT",
  createdAt: "2026-01-15T00:00:00.000Z",
};

function renderDialog(editingUser: UserRow | null = user) {
  const onOpenChange = vi.fn();
  const utils = renderWithQuery(
    <EditUserDialog user={editingUser} onOpenChange={onOpenChange} />,
  );
  return { onOpenChange, ...utils };
}

describe("EditUserDialog", () => {
  beforeEach(() => {
    mockedPatch.mockReset();
  });

  it("does not render the dialog when there is no user to edit", () => {
    renderDialog(null);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders populated with the user's name and email, and a blank password", () => {
    renderDialog();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Ada Lovelace");
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("");
    expect(
      screen.getByText("Leave blank to keep the current password"),
    ).toBeInTheDocument();
  });

  it("shows a validation error for a too-short name and blocks submission", async () => {
    const userEventInstance = userEvent.setup();
    renderDialog();

    const nameInput = screen.getByLabelText("Name");
    await userEventInstance.clear(nameInput);
    await userEventInstance.type(nameInput, "Al");
    await userEventInstance.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("Name must be at least 3 characters"),
    ).toBeInTheDocument();
    expect(mockedPatch).not.toHaveBeenCalled();
  });

  it("shows a validation error for an invalid email and blocks submission", async () => {
    const userEventInstance = userEvent.setup();
    renderDialog();

    const emailInput = screen.getByLabelText("Email");
    await userEventInstance.clear(emailInput);
    await userEventInstance.type(emailInput, "not-an-email");
    await userEventInstance.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Invalid email")).toBeInTheDocument();
    expect(mockedPatch).not.toHaveBeenCalled();
  });

  it("shows a validation error for a too-short password and blocks submission", async () => {
    const userEventInstance = userEvent.setup();
    renderDialog();

    await userEventInstance.type(screen.getByLabelText("Password"), "short");
    await userEventInstance.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
    expect(mockedPatch).not.toHaveBeenCalled();
  });

  it("saves without a password when the password field is left blank", async () => {
    const userEventInstance = userEvent.setup();
    mockedPatch.mockResolvedValue({
      data: { ...user, name: "Ada Byron" },
    });
    const { onOpenChange } = renderDialog();

    const nameInput = screen.getByLabelText("Name");
    await userEventInstance.clear(nameInput);
    await userEventInstance.type(nameInput, "Ada Byron");
    await userEventInstance.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith("/api/users/1", {
        name: "Ada Byron",
        email: "ada@example.com",
        password: "",
      });
    });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("includes the new password in the payload when one is typed", async () => {
    const userEventInstance = userEvent.setup();
    mockedPatch.mockResolvedValue({ data: user });
    renderDialog();

    await userEventInstance.type(screen.getByLabelText("Password"), "newpassword123");
    await userEventInstance.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith("/api/users/1", {
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "newpassword123",
      });
    });
  });

  it("shows a server error inline and keeps the dialog open", async () => {
    const userEventInstance = userEvent.setup();
    mockedPatch.mockRejectedValue(
      new AxiosError("Request failed", "409", undefined, undefined, {
        status: 409,
        statusText: "Conflict",
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: { error: "Email already in use" },
      }),
    );
    const { onOpenChange } = renderDialog();

    await userEventInstance.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Email already in use")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("falls back to a generic message for a non-axios error", async () => {
    const userEventInstance = userEvent.setup();
    mockedPatch.mockRejectedValue(new Error("network down"));
    renderDialog();

    await userEventInstance.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Failed to update user")).toBeInTheDocument();
  });

  it("disables the submit button and shows a pending label while saving", async () => {
    const userEventInstance = userEvent.setup();
    let resolvePatch: (value: unknown) => void = () => {};
    mockedPatch.mockReturnValue(
      new Promise((resolve) => {
        resolvePatch = resolve;
      }),
    );
    renderDialog();

    await userEventInstance.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();

    resolvePatch({ data: user });
  });
});
