import { ticketReplyCreateSchema, type TicketReplyCreateInput } from "@helpdesk/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

interface ReplyFormProps {
  ticketId: string;
}

export function ReplyForm({ ticketId }: ReplyFormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TicketReplyCreateInput>({
    resolver: zodResolver(ticketReplyCreateSchema),
  });

  const mutation = useMutation({
    mutationFn: (values: TicketReplyCreateInput) =>
      api.post(`/api/tickets/${ticketId}/replies`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId, "replies"] });
      reset();
    },
  });

  const onSubmit = (values: TicketReplyCreateInput) => {
    mutation.mutate(values);
  };

  const serverError = getErrorMessage(mutation.error, "Failed to post reply");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4">
      <FieldGroup>
        <Field data-invalid={!!errors.body}>
          <FieldLabel htmlFor="reply-body">Reply</FieldLabel>
          <Textarea
            id="reply-body"
            rows={4}
            aria-invalid={!!errors.body}
            {...register("body")}
          />
          <FieldError errors={[errors.body]} />
        </Field>
        {serverError && <FieldError>{serverError}</FieldError>}
      </FieldGroup>
      <Button type="submit" className="mt-3" disabled={isSubmitting || mutation.isPending}>
        {isSubmitting || mutation.isPending ? "Posting…" : "Post reply"}
      </Button>
    </form>
  );
}
