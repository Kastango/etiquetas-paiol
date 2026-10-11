"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { tabs, tools } from "@/lib/tools";
import { cn } from "@/lib/utils";

/*
 * Desktop: a side menu that collapses to icons. The choice lives in localStorage and on
 * <html data-nav>, set by a script in the layout before the first paint so the page never jumps.
 * Phone: a top bar with the page name and a tab bar at the bottom, within reach of the thumb.
 */
const NAV_KEY = "nav";
const NAV_EVENT = "paiol-nav";

function useCollapsed() {
  return useSyncExternalStore(
    change => {
      window.addEventListener(NAV_EVENT, change);
      return () => window.removeEventListener(NAV_EVENT, change);
    },
    () => document.documentElement.dataset.nav === "collapsed",
    () => false,
  );
}

function setCollapsed(collapsed: boolean) {
  if (collapsed) document.documentElement.dataset.nav = "collapsed";
  else delete document.documentElement.dataset.nav;
  localStorage.setItem(NAV_KEY, collapsed ? "collapsed" : "open");
  window.dispatchEvent(new Event(NAV_EVENT));
}

/** Runs in <head> before the page paints. */
export const navScript = `try{if(localStorage.getItem("${NAV_KEY}")==="collapsed")document.documentElement.dataset.nav="collapsed"}catch(e){}`;

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

export function AppNav() {
  const pathname = usePathname();
  const collapsed = useCollapsed();
  const current = tools.find(tool => isActive(pathname, tool.href));

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur-sm md:hidden">
        <Link href="/" className="rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
          <Image src="/brand/paiol-horizontal-color.svg" alt="Paiol, início" width={92} height={32} priority className="h-8 w-auto" />
        </Link>
        {current && <span className="text-sm font-semibold">{current.label}</span>}
      </header>

      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 overflow-hidden border-r bg-card px-3 py-6 md:flex">
        <Link href="/" title="Início" className="flex h-10 items-center rounded-md px-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
          <Image src="/brand/paiol-horizontal-color.svg" alt="Paiol, início" width={112} height={39} priority className="h-9 w-auto collapsed:hidden" />
          <Image src="/brand/paiol-symbol.svg" alt="Paiol, início" width={34} height={40} className="hidden h-9 w-auto collapsed:block" />
        </Link>
        <nav aria-label="Ferramentas" className="flex flex-col gap-1">
          {tools.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link key={href} href={href} title={collapsed ? label : undefined} aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring collapsed:justify-center collapsed:px-0",
                  active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                )}>
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate collapsed:sr-only">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-4">
          <p className="px-2 text-xs leading-relaxed text-muted-foreground collapsed:hidden">
            Ferramentas internas. Os dados ficam salvos só neste navegador.
          </p>
          <button type="button" onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed}
            title={collapsed ? "Expandir menu" : undefined}
            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring collapsed:justify-center collapsed:px-0">
            {collapsed ? <PanelLeftOpen className="size-4 shrink-0" aria-hidden /> : <PanelLeftClose className="size-4 shrink-0" aria-hidden />}
            <span className="collapsed:sr-only">{collapsed ? "Expandir menu" : "Recolher menu"}</span>
          </button>
        </div>
      </aside>

      <nav aria-label="Ferramentas" className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
        <ul className="grid grid-cols-4">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? "page" : undefined}
                  className={cn("flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    active && "text-primary")}>
                  <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-primary/12")}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
