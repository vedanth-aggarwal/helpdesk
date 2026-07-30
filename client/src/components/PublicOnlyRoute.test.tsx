import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { PublicOnlyRoute } from "./PublicOnlyRoute";
import { authClient } from "@/lib/auth-client";
import { mockSessionValue } from "@/test/mockSession";

vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: vi.fn() },
}));

const mockedUseSession = vi.mocked(authClient.useSession);

function renderPublicOnlyRoute() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/" element={<div>Home page</div>} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<div>Login page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicOnlyRoute", () => {
  it("shows a loading state while the session is pending", () => {
    mockedUseSession.mockReturnValue(mockSessionValue(null, true));

    renderPublicOnlyRoute();

    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });

  it("redirects to / when a session exists", () => {
    mockedUseSession.mockReturnValue(mockSessionValue({ role: "AGENT" }));

    renderPublicOnlyRoute();

    expect(screen.getByText("Home page")).toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });

  it("renders the outlet when there is no session", () => {
    mockedUseSession.mockReturnValue(mockSessionValue(null));

    renderPublicOnlyRoute();

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });
});
