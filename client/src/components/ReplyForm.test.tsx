import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { ReplyForm } from "./ReplyForm";
import { api } from "@/lib/api";
import { renderWithQuery } from "@/test/renderWithQuery";

vi.mock("@/lib/api", () => ({
  api: { post: vi.fn() },
}));

const mockedPost = vi.mocked(api.post);

describe("ReplyForm", () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it("shows a validation error for an empty reply and blocks submission", async () => {
    const user = userEvent.setup();
    renderWithQuery(<ReplyForm ticketId="1" />);

    await user.click(screen.getByRole("button", { name: "Post reply" }));

    expect(await screen.findByText("Reply cannot be empty")).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("submits the reply and clears the form on success", async () => {
    const user = userEvent.setup();
    mockedPost.mockResolvedValue({
      data: {
        id: 2,
        body: "On it!",
        createdAt: "2026-07-30T09:05:00.000Z",
        author: { id: "agent-1", name: "Alex Kim" },
      },
    });
    renderWithQuery(<ReplyForm ticketId="1" />);

    const textarea = screen.getByLabelText("Reply");
    await user.type(textarea, "On it!");
    await user.click(screen.getByRole("button", { name: "Post reply" }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith("/api/tickets/1/replies", { body: "On it!" });
    });

    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });

  it("shows a server error inline when posting fails", async () => {
    const user = userEvent.setup();
    mockedPost.mockRejectedValue(
      new AxiosError("Request failed", "400", undefined, undefined, {
        status: 400,
        statusText: "Bad Request",
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: { error: "Invalid request body" },
      }),
    );
    renderWithQuery(<ReplyForm ticketId="1" />);

    await user.type(screen.getByLabelText("Reply"), "On it!");
    await user.click(screen.getByRole("button", { name: "Post reply" }));

    expect(await screen.findByText("Invalid request body")).toBeInTheDocument();
  });

  it("falls back to a generic message for a non-axios error", async () => {
    const user = userEvent.setup();
    mockedPost.mockRejectedValue(new Error("network down"));
    renderWithQuery(<ReplyForm ticketId="1" />);

    await user.type(screen.getByLabelText("Reply"), "On it!");
    await user.click(screen.getByRole("button", { name: "Post reply" }));

    expect(await screen.findByText("Failed to post reply")).toBeInTheDocument();
  });

  it("disables the submit button and shows a pending label while submitting", async () => {
    const user = userEvent.setup();
    let resolvePost: (value: unknown) => void = () => {};
    mockedPost.mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve;
      }),
    );
    renderWithQuery(<ReplyForm ticketId="1" />);

    await user.type(screen.getByLabelText("Reply"), "On it!");
    await user.click(screen.getByRole("button", { name: "Post reply" }));

    expect(await screen.findByRole("button", { name: "Posting…" })).toBeDisabled();

    resolvePost({
      data: {
        id: 2,
        body: "On it!",
        createdAt: "2026-07-30T09:05:00.000Z",
        author: { id: "agent-1", name: "Alex Kim" },
      },
    });
  });

  it("disables the Polish button when the draft is empty", () => {
    renderWithQuery(<ReplyForm ticketId="1" />);

    expect(screen.getByRole("button", { name: "Polish" })).toBeDisabled();
  });

  it("enables the Polish button once a draft is entered", async () => {
    const user = userEvent.setup();
    renderWithQuery(<ReplyForm ticketId="1" />);

    await user.type(screen.getByLabelText("Reply"), "hey u just click the link lol");

    expect(screen.getByRole("button", { name: "Polish" })).toBeEnabled();
  });

  it("replaces the draft with the polished text on success", async () => {
    const user = userEvent.setup();
    mockedPost.mockResolvedValue({
      data: { body: "Hello Alex, please click the link. Regards,\nAdmin" },
    });
    renderWithQuery(<ReplyForm ticketId="1" />);

    const textarea = screen.getByLabelText("Reply");
    await user.type(textarea, "hey u just click the link lol");
    await user.click(screen.getByRole("button", { name: "Polish" }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith("/api/tickets/1/polish-reply", {
        body: "hey u just click the link lol",
      });
    });

    await waitFor(() => {
      expect(textarea).toHaveValue("Hello Alex, please click the link. Regards,\nAdmin");
    });
  });

  it("disables the Polish button and shows a pending label while polishing", async () => {
    const user = userEvent.setup();
    let resolvePolish: (value: unknown) => void = () => {};
    mockedPost.mockReturnValue(
      new Promise((resolve) => {
        resolvePolish = resolve;
      }),
    );
    renderWithQuery(<ReplyForm ticketId="1" />);

    await user.type(screen.getByLabelText("Reply"), "hey u just click the link lol");
    await user.click(screen.getByRole("button", { name: "Polish" }));

    expect(await screen.findByRole("button", { name: "Polishing…" })).toBeDisabled();

    resolvePolish({ data: { body: "Polished text" } });
  });

  it("shows a server error inline when polishing fails", async () => {
    const user = userEvent.setup();
    mockedPost.mockRejectedValue(
      new AxiosError("Request failed", "502", undefined, undefined, {
        status: 502,
        statusText: "Bad Gateway",
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: { error: "Failed to polish reply" },
      }),
    );
    renderWithQuery(<ReplyForm ticketId="1" />);

    await user.type(screen.getByLabelText("Reply"), "hey u just click the link lol");
    await user.click(screen.getByRole("button", { name: "Polish" }));

    expect(await screen.findByText("Failed to polish reply")).toBeInTheDocument();
  });

  it("does not submit the form when the Polish button is clicked", async () => {
    const user = userEvent.setup();
    mockedPost.mockResolvedValue({ data: { body: "Polished text" } });
    renderWithQuery(<ReplyForm ticketId="1" />);

    await user.type(screen.getByLabelText("Reply"), "hey u just click the link lol");
    await user.click(screen.getByRole("button", { name: "Polish" }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith("/api/tickets/1/polish-reply", {
        body: "hey u just click the link lol",
      });
    });

    expect(mockedPost).not.toHaveBeenCalledWith("/api/tickets/1/replies", expect.anything());
  });
});
