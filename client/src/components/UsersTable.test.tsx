import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UsersTable, type UserRow } from "./UsersTable";

const users: UserRow[] = [
  {
    id: "1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    role: "ADMIN",
    createdAt: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Grace Hopper",
    email: "grace@example.com",
    role: "AGENT",
    createdAt: "2026-02-20T00:00:00.000Z",
  },
];

describe("UsersTable", () => {
  it("renders a skeleton row per placeholder while loading", () => {
    render(<UsersTable users={undefined} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getAllByRole("row")).toHaveLength(6); // header + 5 skeleton rows
  });

  it("renders an edit button for each user", () => {
    render(<UsersTable users={users} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Edit Ada Lovelace" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Grace Hopper" })).toBeInTheDocument();
  });

  it("calls onEdit with the clicked user's data", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<UsersTable users={users} onEdit={onEdit} onDelete={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Edit Grace Hopper" }));

    expect(onEdit).toHaveBeenCalledWith(users[1]);
  });

  it("renders a delete button for each user", () => {
    render(<UsersTable users={users} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Delete Ada Lovelace" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Grace Hopper" })).toBeInTheDocument();
  });

  it("calls onDelete with the clicked user's data", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<UsersTable users={users} onEdit={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Delete Grace Hopper" }));

    expect(onDelete).toHaveBeenCalledWith(users[1]);
  });

  it("disables the delete button for an admin user", () => {
    render(<UsersTable users={users} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Delete Ada Lovelace" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete Grace Hopper" })).not.toBeDisabled();
  });
});
