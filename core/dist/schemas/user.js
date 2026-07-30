"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
/**
 * Shared by the admin "Add user" form (react-hook-form + zodResolver) and the
 * POST /api/users route handler, so client-side and server-side validation can
 * never drift. The messages are asserted on by component and e2e tests.
 */
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(3, "Name must be at least 3 characters"),
    email: zod_1.z.email("Invalid email"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
});
/**
 * Derived from createUserSchema (not redefined) so name/email rules and
 * messages can't drift between create and edit. Password is optional here —
 * blank means "don't change the password", enforced by the admin "Edit user"
 * form and the PATCH /api/users/:id route handler.
 */
exports.updateUserSchema = exports.createUserSchema.omit({ password: true }).extend({
    password: zod_1.z
        .string()
        .optional()
        .refine((val) => !val || val.length >= 8, {
        message: "Password must be at least 8 characters",
    }),
});
//# sourceMappingURL=user.js.map