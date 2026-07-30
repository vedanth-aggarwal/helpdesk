export declare const auth: import("better-auth").Auth<{
    database: (options: import("better-auth").BetterAuthOptions) => import("better-auth").DBAdapter<import("better-auth").BetterAuthOptions>;
    emailAndPassword: {
        enabled: true;
        disableSignUp: true;
    };
    baseURL: string | undefined;
    secret: string | undefined;
    trustedOrigins: string[];
    rateLimit: {
        enabled: boolean;
    };
    user: {
        additionalFields: {
            role: {
                type: "string";
                defaultValue: string;
            };
        };
    };
}>;
//# sourceMappingURL=auth.d.ts.map