import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { CreateUserDialog } from "./CreateUserDialog";
import { api } from "@/lib/api";
import { renderWithQuery } from "@/test/renderWithQuery";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const mockedPost = vi.mocked(api.post);

function renderDialog(open = true) {
  const onOpenChange = vi.fn();
  const utils = renderWithQuery(
    <CreateUserDialog open={open} onOpenChange={onOpenChange} />,
  );
  return { onOpenChange, ...utils };
}

describe("CreateUserDialog", () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it("does not render the dialog when closed", () => {
    renderDialog(false);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the name, email, and password fields when open", () => {
    renderDialog();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("shows a validation error for a too-short name and blocks submission", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Name"), "Al");
    await user.type(screen.getByLabelText("Email"), "al@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(
      await screen.findByText("Name must be at least 3 characters"),
    ).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("shows a validation error for an invalid email and blocks submission", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Name"), "Alan Turing");
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByText("Invalid email")).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("shows a validation error for a too-short password and blocks submission", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Name"), "Alan Turing");
    await user.type(screen.getByLabelText("Email"), "alan@example.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(
      await screen.findByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("submits the form, closes the dialog, and refreshes the list on success", async () => {
    const user = userEvent.setup();
    mockedPost.mockResolvedValue({
      data: {
        id: "1",
        name: "Alan Turing",
        email: "alan@example.com",
        role: "AGENT",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    const { onOpenChange } = renderDialog();

    await user.type(screen.getByLabelText("Name"), "Alan Turing");
    await user.type(screen.getByLabelText("Email"), "alan@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith("/api/users", {
        name: "Alan Turing",
        email: "alan@example.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("shows a server error inline and keeps the dialog open", async () => {
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
    const { onOpenChange } = renderDialog();

    await user.type(screen.getByLabelText("Name"), "Alan Turing");
    await user.type(screen.getByLabelText("Email"), "alan@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByText("Email already in use")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("falls back to a generic message for a non-axios error", async () => {
    const user = userEvent.setup();
    mockedPost.mockRejectedValue(new Error("network down"));
    renderDialog();

    await user.type(screen.getByLabelText("Name"), "Alan Turing");
    await user.type(screen.getByLabelText("Email"), "alan@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByText("Failed to create user")).toBeInTheDocument();
  });

  it("disables the submit button and shows a pending label while submitting", async () => {
    const user = userEvent.setup();
    let resolvePost: (value: unknown) => void = () => {};
    mockedPost.mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve;
      }),
    );
    renderDialog();

    await user.type(screen.getByLabelText("Name"), "Alan Turing");
    await user.type(screen.getByLabelText("Email"), "alan@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByRole("button", { name: "Creating…" })).toBeDisabled();

    resolvePost({
      data: {
        id: "1",
        name: "Alan Turing",
        email: "alan@example.com",
        role: "AGENT",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
  });
});
