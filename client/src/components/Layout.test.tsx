import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Layout } from "./Layout";
import { authClient } from "@/lib/auth-client";
import { mockSessionValue } from "@/test/mockSession";

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
    mockedUseSession.mockReturnValue(mockSessionValue({ name: "Admin", role: "ADMIN" }));

    renderLayout();

    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
  });

  it("hides the Users nav link for an AGENT", () => {
    mockedUseSession.mockReturnValue(mockSessionValue({ name: "Some Agent", role: "AGENT" }));

    renderLayout();

    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
  });

  it("always shows the Tickets nav link, regardless of role", () => {
    mockedUseSession.mockReturnValue(mockSessionValue({ name: "Some Agent", role: "AGENT" }));

    renderLayout();

    expect(screen.getByRole("link", { name: "Tickets" })).toBeInTheDocument();
  });
});
