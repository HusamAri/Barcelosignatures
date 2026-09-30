import Link from "next/link";
import { CalendarDays, Image as ImageIcon, LayoutDashboard, LayoutTemplate, LogOut, ShieldCheck, Stethoscope, Users, UsersRound } from "lucide-react";
import { requireAdmin } from "@/lib/auth";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/groups", label: "Groups", icon: UsersRound },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/admin/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/admin/admins", label: "Admins", icon: ShieldCheck },
  { href: "/admin/debug", label: "Debug", icon: Stethoscope },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-panel p-4 md:flex">
        <div className="mb-8 px-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Barceló Hotel Group Türkiye</p>
          <p className="text-lg font-bold">Signature Manager</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted hover:bg-panel-2 hover:text-text">
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
        <form action="/auth/signout" method="post" className="mt-6 border-t border-border pt-4">
          <p className="mb-2 truncate px-2 text-xs text-muted" title={session.email}>{session.email}</p>
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted hover:bg-panel-2 hover:text-text" type="submit">
            <LogOut size={16} /> Sign out
          </button>
        </form>
      </aside>
      <div className="flex-1">
        <header className="flex items-center gap-2 overflow-x-auto border-b border-border bg-panel px-4 py-3 md:hidden">
          {nav.map(({ href, label }) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted hover:bg-panel-2 hover:text-text">
              {label}
            </Link>
          ))}
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
