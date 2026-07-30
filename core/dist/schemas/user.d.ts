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
/**
 * Derived from createUserSchema (not redefined) so name/email rules and
 * messages can't drift between create and edit. Password is optional here —
 * blank means "don't change the password", enforced by the admin "Edit user"
 * form and the PATCH /api/users/:id route handler.
 */
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export declare const userIdParamSchema: z.ZodObject<{
    id: z.ZodUUID;
}, z.core.$strip>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
//# sourceMappingURL=user.d.ts.map