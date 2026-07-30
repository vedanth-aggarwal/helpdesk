import { z } from "zod";
/**
 * Shared by the admin "Add user" form (react-hook-form + zodResolver) and the
 * POST /api/users route handler, so client-side and server-side validation can
 * never drift. The messages are asserted on by component and e2e tests.
 */
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
}, z.core.$strip>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
//# sourceMappingURL=user.d.ts.map