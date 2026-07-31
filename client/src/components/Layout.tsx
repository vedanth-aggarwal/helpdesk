import { LayoutDashboard, LogOut, Ticket, Users as UsersIcon } from "lucide-react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import { BrandMark } from "@/components/BrandMark";
import { cn } from "@/lib/utils";

const navLinkClass =
  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
const navLinkActiveClass = "bg-accent text-foreground";

export function Layout() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login", { replace: true });
  };

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      <nav className="flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-3 md:h-screen md:w-56 md:flex-none md:flex-col md:items-stretch md:justify-start md:gap-8 md:border-b-0 md:border-r md:px-4 md:py-6">
        <div className="flex items-center gap-6 md:flex-col md:items-stretch md:gap-8">
          <BrandMark />
          <div className="flex items-center gap-1 md:flex-col md:items-stretch">
            <Link to="/" className={cn(navLinkClass, isActive("/") && navLinkActiveClass)}>
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
            <Link
              to="/tickets"
              className={cn(navLinkClass, isActive("/tickets") && navLinkActiveClass)}
            >
              <Ticket className="size-4" />
              Tickets
            </Link>
            {session?.user.role === "ADMIN" && (
              <Link
                to="/users"
                className={cn(navLinkClass, isActive("/users") && navLinkActiveClass)}
              >
                <UsersIcon className="size-4" />
                Users
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 md:flex-col md:items-stretch md:gap-3">
          <span className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 rounded-full bg-status-resolved motion-safe:animate-ping" />
              <span className="relative size-1.5 rounded-full bg-status-resolved" />
            </span>
            System live
          </span>
          <span className="truncate text-sm text-muted-foreground md:text-xs">
            {session?.user.name}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive md:text-xs"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      </nav>
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
