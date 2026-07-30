import { z } from "zod";

/**
 * Shared by the admin "Add user" form (react-hook-form + zodResolver) and the
 * POST /api/users route handler, so client-side and server-side validation can
 * never drift. The messages are asserted on by component and e2e tests.
 */
export const createUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
