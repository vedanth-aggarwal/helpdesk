import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AdminRoute } from "./AdminRoute";
import { authClient } from "@/lib/auth-client";

vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: vi.fn() },
}));

const mockedUseSession = vi.mocked(authClient.useSession);

function renderAdminRoute() {
  return render(
    <MemoryRouter initialEntries={["/users"]}>
      <Routes>
        <Route path="/" element={<div>Home page</div>} />
        <Route element={<AdminRoute />}>
          <Route path="/users" element={<div>Admin content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminRoute", () => {
  it("shows a loading state while the session is pending", () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: true } as ReturnType<
      typeof authClient.useSession
    >);

    renderAdminRoute();

    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("redirects to / when the user is not an admin", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { role: "AGENT" } },
      isPending: false,
    } as unknown as ReturnType<typeof authClient.useSession>);

    renderAdminRoute();

    expect(screen.getByText("Home page")).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("redirects to / when there is no session at all", () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: false } as ReturnType<
      typeof authClient.useSession
    >);

    renderAdminRoute();

    expect(screen.getByText("Home page")).toBeInTheDocument();
  });

  it("renders the outlet when the user is an admin", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { role: "ADMIN" } },
      isPending: false,
    } as unknown as ReturnType<typeof authClient.useSession>);

    renderAdminRoute();

    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });
});
