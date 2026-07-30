import type { authClient } from "@/lib/auth-client";

type Session = ReturnType<typeof authClient.useSession>;

interface MockSessionUser {
  role: "ADMIN" | "AGENT";
  name?: string;
}

export function mockSessionValue(user: MockSessionUser | null, isPending = false): Session {
  return { data: user ? { user } : null, isPending } as unknown as Session;
}
