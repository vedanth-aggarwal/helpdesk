import { updateUserSchema, type UpdateUserInput } from "@helpdesk/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import type { UserRow } from "@/components/UsersTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { UserFormFields } from "@/components/UserFormFields";

interface EditUserDialogProps {
  user: UserRow | null;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ user, onOpenChange }: EditUserDialogProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    values: user ? { name: user.name, email: user.email, password: "" } : undefined,
  });

  const mutation = useMutation({
    mutationFn: (values: UpdateUserInput) => api.patch(`/api/users/${user!.id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    },
  });

  const onSubmit = (values: UpdateUserInput) => {
    mutation.mutate(values);
  };

  const serverError = mutation.error
    ? isAxiosError(mutation.error)
      ? mutation.error.response?.data?.error || mutation.error.message
      : "Failed to update user"
    : null;

  return (
    <Dialog
      open={!!user}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          reset();
          mutation.reset();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>
            Update {user?.name}&apos;s account details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <UserFormFields
              register={register}
              errors={errors}
              passwordHint="Leave blank to keep the current password"
            />
            {serverError && <FieldError>{serverError}</FieldError>}
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {isSubmitting || mutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
