import { Link } from "react-router-dom";

export function BrandMark() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 font-heading text-sm font-semibold tracking-wide text-foreground"
    >
      <span className="size-2.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      HELPDESK
    </Link>
  );
}
