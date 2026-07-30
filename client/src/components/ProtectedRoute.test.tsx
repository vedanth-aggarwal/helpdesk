import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";
import { authClient } from "@/lib/auth-client";
import { mockSessionValue } from "@/test/mockSession";

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
    mockedUseSession.mockReturnValue(mockSessionValue(null, true));

    renderProtectedRoute();

    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("redirects to /login when there is no session", () => {
    mockedUseSession.mockReturnValue(mockSessionValue(null));

    renderProtectedRoute();

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders the outlet when a session exists", () => {
    mockedUseSession.mockReturnValue(mockSessionValue({ role: "AGENT" }));

    renderProtectedRoute();

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
