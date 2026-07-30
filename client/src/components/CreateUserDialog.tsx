import { createUserSchema, type CreateUserInput } from "@helpdesk/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { withResetOnClose } from "@/lib/dialog";
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

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
  });

  const mutation = useMutation({
    mutationFn: (values: CreateUserInput) => api.post("/api/users", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      reset();
      onOpenChange(false);
    },
  });

  const onSubmit = (values: CreateUserInput) => {
    mutation.mutate(values);
  };

  const serverError = getErrorMessage(mutation.error, "Failed to create user");

  return (
    <Dialog
      open={open}
      onOpenChange={withResetOnClose(onOpenChange, () => {
        reset();
        mutation.reset();
      })}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Create a new agent account. They&apos;ll be able to sign in with the
            email and password below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <UserFormFields register={register} errors={errors} />
            {serverError && <FieldError>{serverError}</FieldError>}
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {isSubmitting || mutation.isPending ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
