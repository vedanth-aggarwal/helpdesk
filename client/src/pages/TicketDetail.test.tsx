import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TicketDetail } from "./TicketDetail";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { renderWithQuery } from "@/test/renderWithQuery";
import { mockSessionValue } from "@/test/mockSession";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: vi.fn() },
}));

const mockedGet = vi.mocked(api.get);
const mockedPatch = vi.mocked(api.patch);
const mockedPost = vi.mocked(api.post);
const mockedUseSession = vi.mocked(authClient.useSession);

function mockSession(role: "ADMIN" | "AGENT") {
  mockedUseSession.mockReturnValue(mockSessionValue({ role }));
}

function renderDetail(id = "1") {
  return renderWithQuery(
    <MemoryRouter initialEntries={[`/tickets/${id}`]}>
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

const ticket = {
  id: 1,
  subject: "Cannot log in",
  body: "I've tried resetting my password twice but still can't log in.",
  requesterEmail: "jane@example.com",
  requesterName: "Jane Doe",
  status: "OPEN" as const,
  category: null,
  assignee: null,
  messageId: "abc123",
  createdAt: "2026-07-30T08:48:27.663Z",
  updatedAt: "2026-07-30T08:48:27.663Z",
};

const agents = [
  { id: "agent-1", name: "Alex Kim", email: "alex@example.com" },
  { id: "agent-2", name: "Priya Patel", email: "priya@example.com" },
];

const replies = [
  {
    id: 1,
    body: "Thanks for reaching out, looking into this now.",
    senderType: "AGENT" as const,
    createdAt: "2026-07-30T09:00:00.000Z",
    author: { id: "agent-1", name: "Alex Kim" },
  },
];

const multipleReplies = [
  ...replies,
  {
    id: 2,
    body: "Actually, I fixed it myself, thanks!",
    senderType: "CUSTOMER" as const,
    createdAt: "2026-07-30T09:10:00.000Z",
    author: { id: "requester-1", name: "Jane Doe" },
  },
];

describe("TicketDetail", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPatch.mockReset();
    mockedPost.mockReset();
    mockedUseSession.mockReset();
    mockSession("AGENT");
    mockedGet.mockImplementation(async (url: string) => {
      if (url === "/api/agents") {
        return { data: agents };
      }
      if (url === "/api/tickets/1/replies") {
        return { data: replies };
      }
      return { data: ticket };
    });
  });

  it("renders a loading skeleton before data resolves", () => {
    mockedGet.mockReturnValue(new Promise(() => {}));

    renderDetail();

    expect(screen.getByText("← Back to tickets")).toBeInTheDocument();
    expect(screen.queryByText("Cannot log in")).not.toBeInTheDocument();
  });

  it("renders the ticket subject, body, requester, status, category, and created date", async () => {
    renderDetail();

    await waitFor(() => {
      expect(screen.getByText("Cannot log in")).toBeInTheDocument();
    });

    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText(/jane@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/I've tried resetting my password twice/)).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toHaveTextContent("Open");
    expect(screen.getByLabelText("Category")).toHaveTextContent("Uncategorized");
  });

  it("renders a non-null category humanized", async () => {
    mockedGet.mockImplementation(async (url: string) => {
      if (url === "/api/agents") return { data: agents };
      return { data: { ...ticket, category: "REFUND_REQUEST" as const } };
    });

    renderDetail();

    await waitFor(() => {
      expect(screen.getByLabelText("Category")).toHaveTextContent("Refund Request");
    });
  });

  it("updates the status when a new status is selected", async () => {
    mockedPatch.mockResolvedValue({ data: { id: 1, status: "RESOLVED", category: null } });

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText("Cannot log in")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByLabelText("Status"));
    await userEvent.click(await screen.findByRole("option", { name: "Resolved" }));

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith("/api/tickets/1", { status: "RESOLVED" });
    });
  });

  it("updates the category when a new category is selected", async () => {
    mockedPatch.mockResolvedValue({ data: { id: 1, status: "OPEN", category: "GENERAL_QUESTION" } });

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText("Cannot log in")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByLabelText("Category"));
    await userEvent.click(await screen.findByRole("option", { name: "General Question" }));

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith("/api/tickets/1", {
        category: "GENERAL_QUESTION",
      });
    });
  });

  it("renders an inline error when the status/category update mutation fails", async () => {
    mockedPatch.mockRejectedValue(
      new AxiosError("Request failed", "400", undefined, undefined, {
        status: 400,
        statusText: "Bad Request",
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: { error: "Invalid request body" },
      }),
    );

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText("Cannot log in")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByLabelText("Status"));
    await userEvent.click(await screen.findByRole("option", { name: "Resolved" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid request body")).toBeInTheDocument();
    });
  });

  it("renders the server error message on a 404", async () => {
    mockedGet.mockRejectedValue(
      new AxiosError("Request failed", "404", undefined, undefined, {
        status: 404,
        statusText: "Not Found",
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: { error: "Ticket not found" },
      }),
    );

    renderDetail("999999");

    await waitFor(() => {
      expect(screen.getByText("Ticket not found")).toBeInTheDocument();
    });
  });

  it("falls back to a generic message for non-axios errors", async () => {
    mockedGet.mockRejectedValue(new Error("boom"));

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText("Failed to load ticket")).toBeInTheDocument();
    });
  });

  it("renders the reply thread with author name, timestamp, and body", async () => {
    renderDetail();

    await waitFor(() => {
      expect(screen.getByText("Alex Kim")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Thanks for reaching out, looking into this now."),
    ).toBeInTheDocument();
    expect(screen.getByText("Agent")).toBeInTheDocument();
  });

  it("renders multiple replies in the order returned, with per-reply sender type badges", async () => {
    mockedGet.mockImplementation(async (url: string) => {
      if (url === "/api/agents") return { data: agents };
      if (url === "/api/tickets/1/replies") return { data: multipleReplies };
      return { data: ticket };
    });

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText("Alex Kim")).toBeInTheDocument();
    });

    const replyBodies = screen
      .getAllByText(/Thanks for reaching out|Actually, I fixed it myself/)
      .map((el) => el.textContent);
    expect(replyBodies).toEqual([
      "Thanks for reaching out, looking into this now.",
      "Actually, I fixed it myself, thanks!",
    ]);

    expect(screen.getByText("Agent")).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("refetches the reply thread after successfully posting a new reply", async () => {
    mockedPost.mockResolvedValue({
      data: { id: 3, body: "Following up", createdAt: "2026-07-30T09:20:00.000Z", author: agents[0] },
    });

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText("Cannot log in")).toBeInTheDocument();
    });

    const repliesCallsBefore = mockedGet.mock.calls.filter(
      ([url]) => url === "/api/tickets/1/replies",
    ).length;

    await userEvent.type(screen.getByLabelText("Reply"), "Following up");
    await userEvent.click(screen.getByRole("button", { name: "Post reply" }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith("/api/tickets/1/replies", { body: "Following up" });
    });

    await waitFor(() => {
      const repliesCallsAfter = mockedGet.mock.calls.filter(
        ([url]) => url === "/api/tickets/1/replies",
      ).length;
      expect(repliesCallsAfter).toBeGreaterThan(repliesCallsBefore);
    });
  });

  it("renders 'No replies yet.' when the replies list is empty", async () => {
    mockedGet.mockImplementation(async (url: string) => {
      if (url === "/api/agents") return { data: agents };
      if (url === "/api/tickets/1/replies") return { data: [] };
      return { data: ticket };
    });

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText("No replies yet.")).toBeInTheDocument();
    });
  });

  it("submits a new reply and clears the form", async () => {
    mockedPost.mockResolvedValue({
      data: { id: 2, body: "On it!", createdAt: "2026-07-30T09:05:00.000Z", author: agents[0] },
    });

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText("Cannot log in")).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText("Reply");
    await userEvent.type(textarea, "On it!");
    await userEvent.click(screen.getByRole("button", { name: "Post reply" }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith("/api/tickets/1/replies", { body: "On it!" });
    });

    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });

  it("renders a back link to the tickets list", () => {
    renderDetail();

    expect(screen.getByRole("link", { name: /back to tickets/i })).toHaveAttribute(
      "href",
      "/tickets",
    );
  });

  describe("as an agent", () => {
    it("renders the assignee as read-only text and never fetches the agents list", async () => {
      mockSession("AGENT");

      renderDetail();

      await waitFor(() => {
        expect(screen.getByText("Cannot log in")).toBeInTheDocument();
      });

      expect(screen.getByText("Unassigned")).toBeInTheDocument();
      expect(screen.queryByLabelText("Assigned to")).not.toBeInTheDocument();
      expect(mockedGet).not.toHaveBeenCalledWith("/api/agents");
    });
  });

  describe("as an admin", () => {
    it("renders an assignee dropdown populated from /api/agents", async () => {
      mockSession("ADMIN");

      renderDetail();

      await waitFor(() => {
        expect(screen.getByText("Cannot log in")).toBeInTheDocument();
      });

      expect(screen.getByLabelText("Assigned to")).toBeInTheDocument();
      await waitFor(() => {
        expect(mockedGet).toHaveBeenCalledWith("/api/agents");
      });
    });

    it("assigns the ticket when an agent is selected", async () => {
      mockSession("ADMIN");
      mockedPatch.mockResolvedValue({
        data: { id: 1, assignee: agents[0] },
      });

      renderDetail();

      await waitFor(() => {
        expect(screen.getByText("Cannot log in")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByLabelText("Assigned to"));
      await userEvent.click(await screen.findByRole("option", { name: "Alex Kim" }));

      await waitFor(() => {
        expect(mockedPatch).toHaveBeenCalledWith("/api/tickets/1/assign", {
          assigneeId: "agent-1",
        });
      });
    });

    it("renders an inline error when the assignment mutation fails", async () => {
      mockSession("ADMIN");
      mockedPatch.mockRejectedValue(
        new AxiosError("Request failed", "400", undefined, undefined, {
          status: 400,
          statusText: "Bad Request",
          headers: new AxiosHeaders(),
          config: { headers: new AxiosHeaders() },
          data: { error: "Assignee must be an active agent" },
        }),
      );

      renderDetail();

      await waitFor(() => {
        expect(screen.getByText("Cannot log in")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByLabelText("Assigned to"));
      await userEvent.click(await screen.findByRole("option", { name: "Alex Kim" }));

      await waitFor(() => {
        expect(screen.getByText("Assignee must be an active agent")).toBeInTheDocument();
      });
    });
  });
});
