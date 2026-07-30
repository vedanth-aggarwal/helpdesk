import type {
  FieldError as RHFFieldError,
  FieldErrors,
  Path,
  UseFormRegister,
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface UserFormFieldsProps<
  T extends { name: string; email: string; password?: string },
> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  passwordHint?: string;
}

export function UserFormFields<
  T extends { name: string; email: string; password?: string },
>({ register, errors, passwordHint }: UserFormFieldsProps<T>) {
  return (
    <>
      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input
          id="name"
          autoComplete="name"
          aria-invalid={!!errors.name}
          {...register("name" as Path<T>)}
        />
        <FieldError errors={[errors.name as RHFFieldError | undefined]} />
      </Field>
      <Field data-invalid={!!errors.email}>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email" as Path<T>)}
        />
        <FieldError errors={[errors.email as RHFFieldError | undefined]} />
      </Field>
      <Field data-invalid={!!errors.password}>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register("password" as Path<T>)}
        />
        {passwordHint && (
          <p className="text-xs text-muted-foreground">{passwordHint}</p>
        )}
        <FieldError errors={[errors.password as RHFFieldError | undefined]} />
      </Field>
    </>
  );
}
