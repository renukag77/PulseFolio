import { Link } from "@tanstack/react-router";
import { Activity, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/holdings", label: "Holdings" },
  { to: "/alerts", label: "Alerts" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span
              className="grid size-8 place-items-center rounded-lg text-primary-foreground"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Activity className="size-4" />
            </span>
            PulseFolio
          </Link>

          <nav className="order-3 flex w-full items-center gap-1 sm:order-none sm:w-auto">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-secondary-foreground font-medium" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Button variant="ghost" size="sm" className="ml-auto gap-2" onClick={logout}>
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
