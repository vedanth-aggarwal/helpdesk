import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { CreateUserDialog } from "@/components/CreateUserDialog";
import { EditUserDialog } from "@/components/EditUserDialog";
import { DeleteUserDialog } from "@/components/DeleteUserDialog";
import { UsersTable, type UserRow } from "@/components/UsersTable";
import { Button } from "@/components/ui/button";

export function Users() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);
  const { data: users, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get<UserRow[]>("/api/users");
      return res.data;
    },
  });

  const errorMessage = getErrorMessage(error, "Failed to load users");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Users</h1>
        <Button onClick={() => setIsCreateOpen(true)}>Add user</Button>
      </div>

      <CreateUserDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <EditUserDialog
        user={editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      />
      <DeleteUserDialog
        user={deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      />

      {errorMessage && <p className="mt-4 text-sm text-destructive">{errorMessage}</p>}

      {!errorMessage && (
        <UsersTable users={users} onEdit={setEditingUser} onDelete={setDeletingUser} />
      )}
    </div>
  );
}
