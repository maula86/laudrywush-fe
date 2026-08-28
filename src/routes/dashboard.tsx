import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Factory,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Logo } from "@/components/laundry/logo";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { hasPermission, useCurrentUser, useLaundryStore } from "@/store/laundry-store";
import type { Permission } from "@/lib/laundry/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "view_dashboard" },
  { to: "/dashboard/pos", label: "Kasir / POS", icon: ShoppingCart, perm: "create_order" },
  { to: "/dashboard/orders", label: "Order", icon: Receipt, perm: "view_orders" },
  { to: "/dashboard/production", label: "Produksi", icon: Factory, perm: "update_production" },
  { to: "/dashboard/customers", label: "Pelanggan", icon: Users, perm: "view_orders" },
  { to: "/dashboard/reports", label: "Laporan", icon: BarChart3, perm: "view_reports" },
  { to: "/dashboard/settings", label: "Pengaturan", icon: Settings, perm: "manage_settings" },
] as const satisfies readonly {
  to: string;
  label: string;
  icon: typeof Users;
  perm: Permission;
}[];

const roleLabel: Record<string, string> = {
  admin: "Admin / Owner",
  kasir: "Kasir",
  operator: "Operator",
};

function DashboardLayout() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const logout = useLaundryStore((s) => s.logout);
  const outlet = useLaundryStore((s) => s.outlet);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !user) navigate({ to: "/login" });
  }, [hydrated, user, navigate]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Memuat dashboard…
      </div>
    );
  }

  const items = navItems.filter((item) => hasPermission(user, item.perm));

  return (
    <div className="flex min-h-screen bg-surface">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar p-4 transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <Logo inverted />
          <button
            className="text-sidebar-foreground lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="mt-8 flex-1 space-y-1">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: item.to === "/dashboard" }}
              activeProps={{
                className: "bg-sidebar-primary text-sidebar-primary-foreground",
              }}
              inactiveProps={{
                className:
                  "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            >
              <item.icon className="size-4.5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="rounded-xl bg-sidebar-accent p-3">
          <p className="text-sm font-semibold text-sidebar-accent-foreground">{user.name}</p>
          <p className="text-xs text-sidebar-foreground/70">{roleLabel[user.role]}</p>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="mt-3 flex w-full items-center gap-2 rounded-lg bg-sidebar/60 px-3 py-2 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar"
          >
            <LogOut className="size-3.5" /> Keluar
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
          >
            <Menu />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{outlet.name}</p>
            <p className="truncate text-xs text-muted-foreground">{outlet.address}</p>
          </div>
          <Button asChild variant="outline" size="sm" className="ml-auto">
            <Link to="/tracking">Halaman tracking</Link>
          </Button>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
