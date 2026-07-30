import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/lib/api";
import { CreateUserDialog } from "@/components/CreateUserDialog";
import { EditUserDialog } from "@/components/EditUserDialog";
import { UsersTable, type UserRow } from "@/components/UsersTable";
import { Button } from "@/components/ui/button";

export function Users() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const { data: users, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get<UserRow[]>("/api/users");
      return res.data;
    },
  });

  const errorMessage = error
    ? isAxiosError(error)
      ? error.response?.data?.error || error.message
      : "Failed to load users"
    : null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Users</h1>
        <Button onClick={() => setIsCreateOpen(true)}>Add user</Button>
      </div>

      <CreateUserDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <EditUserDialog
        user={editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      />

      {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}

      {!errorMessage && <UsersTable users={users} onEdit={setEditingUser} />}
    </div>
  );
}
