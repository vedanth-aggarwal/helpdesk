import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Layout } from "./Layout";
import { authClient } from "@/lib/auth-client";

vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: vi.fn(), signOut: vi.fn() },
}));

const mockedUseSession = vi.mocked(authClient.useSession);

function renderLayout() {
  return render(
    <MemoryRouter>
      <Layout />
    </MemoryRouter>,
  );
}

describe("Layout", () => {
  it("shows the Users nav link for an ADMIN", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { name: "Admin", role: "ADMIN" } },
    } as unknown as ReturnType<typeof authClient.useSession>);

    renderLayout();

    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
  });

  it("hides the Users nav link for an AGENT", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { name: "Some Agent", role: "AGENT" } },
    } as unknown as ReturnType<typeof authClient.useSession>);

    renderLayout();

    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
  });

  it("always shows the Tickets nav link, regardless of role", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { name: "Some Agent", role: "AGENT" } },
    } as unknown as ReturnType<typeof authClient.useSession>);

    renderLayout();

    expect(screen.getByRole("link", { name: "Tickets" })).toBeInTheDocument();
  });
});
