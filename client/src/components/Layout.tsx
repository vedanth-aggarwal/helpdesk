import { Link, Outlet, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export function Layout() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-semibold text-gray-900">
            Helpdesk
          </Link>
          {session?.user.role === "ADMIN" && (
            <Link
              to="/users"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Users
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">{session?.user.name}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            Sign out
          </button>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
