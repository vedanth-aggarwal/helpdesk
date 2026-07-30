import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Login } from "./Login";
import { authClient } from "@/lib/auth-client";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/lib/auth-client", () => ({
  authClient: { signIn: { email: vi.fn() } },
}));

const mockedSignInEmail = vi.mocked(authClient.signIn.email);

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

describe("Login", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockedSignInEmail.mockReset();
  });

  it("has empty fields and no alert on initial render", () => {
    renderLogin();

    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows validation errors for empty submission", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(mockedSignInEmail).not.toHaveBeenCalled();
  });

  it("shows a validation error for a malformed email", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "whatever");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid email")).toBeInTheDocument();
    expect(mockedSignInEmail).not.toHaveBeenCalled();
  });

  it("displays the error message from a failed sign-in attempt", async () => {
    const user = userEvent.setup();
    mockedSignInEmail.mockImplementation(async (_credentials, callbacks) => {
      callbacks?.onError?.({
        error: { message: "Invalid email or password" },
      } as Parameters<NonNullable<typeof callbacks.onError>>[0]);
      return {} as Awaited<ReturnType<typeof authClient.signIn.email>>;
    });
    renderLogin();

    await user.type(screen.getByLabelText("Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigates to / on a successful sign-in", async () => {
    const user = userEvent.setup();
    mockedSignInEmail.mockImplementation(async (_credentials, callbacks) => {
      callbacks?.onSuccess?.({} as Parameters<NonNullable<typeof callbacks.onSuccess>>[0]);
      return {} as Awaited<ReturnType<typeof authClient.signIn.email>>;
    });
    renderLogin();

    await user.type(screen.getByLabelText("Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });
});
