"use client";

import { useEffect, useState } from "react";
import { Ticket, Users, ScanLine, BarChart3, LayoutDashboard } from "lucide-react";

interface AppShellNavProps {
  locale: string;
  email: string;
  role: string;
}

const navItems = [
  { label: "Home",      icon: LayoutDashboard, href: (l: string) => `/${l}/app` },
  { label: "Promoter",  icon: Users,           href: (l: string) => `/${l}/app/promoter` },
  { label: "Check-in",  icon: ScanLine,        href: (l: string) => `/${l}/app/staff/checkin` },
  { label: "Organizer", icon: BarChart3,        href: (l: string) => `/${l}/app/organizer/events` },
];

export function AppShellNav({ locale, email, role }: AppShellNavProps) {
  const [pathname, setPathname] = useState('');
  useEffect(() => { setPathname(window.location.pathname); }, []);

  const isActive = (href: string) => {
    if (href === `/${locale}/app`) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 z-40 border-r border-white/[0.04]"
        style={{ background: "rgba(5,5,10,0.95)" }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.04]">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 ring-1 ring-violet-500/30 flex items-center justify-center shrink-0">
            <Ticket className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="text-[13px] font-black tracking-[0.15em] uppercase text-white/80">KARTIS APP</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ label, icon: Icon, href }) => {
            const active = isActive(href(locale));
            return (
              <a
                key={label}
                href={href(locale)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
                  active
                    ? "text-white bg-white/[0.07] ring-1 ring-white/[0.07]"
                    : "text-white/35 hover:text-white/65 hover:bg-white/[0.04]"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-violet-400" : "text-white/25"}`} />
                {label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
              </a>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-white/[0.04] space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/20">{role}</p>
          <p className="text-[12px] text-white/35 truncate">{email}</p>
        </div>
      </aside>

      {/* ── Bottom bar (mobile) ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around border-t border-white/[0.08]"
        style={{
          background: "rgba(5,5,10,0.98)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingTop: "8px",
          paddingLeft: "8px",
          paddingRight: "8px",
        }}
      >
        {navItems.map(({ label, icon: Icon, href }) => {
          const active = isActive(href(locale));
          return (
            <a
              key={label}
              href={href(locale)}
              className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all duration-150 ${
                active ? "text-violet-400" : "text-white/30 hover:text-white/60"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
