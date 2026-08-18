"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS_NAV, docsHref } from "@/lib/docs/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, slug: string) {
  const href = docsHref(slug);
  return pathname === href;
}

export function DocsSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cn("flex flex-col gap-7", className)}>
      {DOCS_NAV.map((group) => (
        <div key={group.heading} className="flex flex-col gap-1">
          <span className="text-muted mb-1.5 px-2.5 font-mono text-[10px] tracking-[0.12em] uppercase">
            {group.heading}
          </span>
          {group.links.map((link) => {
            const active = isActive(pathname, link.slug);
            return (
              <Link
                key={link.slug}
                href={docsHref(link.slug)}
                data-cursor
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-[var(--radius)] px-2.5 py-1.5 text-[13.5px] transition-colors",
                  active
                    ? "bg-brand/12 text-brand-muted font-medium"
                    : "text-muted hover:bg-foreground/6 hover:text-foreground",
                )}
              >
                {link.title}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/** Compact <select> used at the top of the content column on small screens. */
export function DocsMobileNav() {
  const pathname = usePathname();
  return (
    <select
      aria-label="Docs section"
      value={pathname}
      onChange={(e) => {
        window.location.href = e.target.value;
      }}
      className="border-border bg-surface text-foreground h-10 w-full rounded-[var(--radius)] border px-3 text-sm lg:hidden"
    >
      {DOCS_NAV.map((group) => (
        <optgroup key={group.heading} label={group.heading}>
          {group.links.map((link) => (
            <option key={link.slug} value={docsHref(link.slug)}>
              {link.title}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
