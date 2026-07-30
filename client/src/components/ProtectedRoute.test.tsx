import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";
import { authClient } from "@/lib/auth-client";

vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: vi.fn() },
}));

const mockedUseSession = vi.mocked(authClient.useSession);

function renderProtectedRoute(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Protected content</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows a loading state while the session is pending", () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: true } as ReturnType<
      typeof authClient.useSession
    >);

    renderProtectedRoute();

    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("redirects to /login when there is no session", () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: false } as ReturnType<
      typeof authClient.useSession
    >);

    renderProtectedRoute();

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders the outlet when a session exists", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { role: "AGENT" } },
      isPending: false,
    } as unknown as ReturnType<typeof authClient.useSession>);

    renderProtectedRoute();

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
