import { Navigate, Outlet } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export function PublicOnlyRoute() {
  const { data, isPending } = authClient.useSession();

  if (isPending) return <div className="p-6 text-gray-500">Loading…</div>;
  if (data) return <Navigate to="/" replace />;

  return <Outlet />;
}
