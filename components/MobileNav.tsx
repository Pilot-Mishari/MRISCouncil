"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string };

export default function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // stop the page scrolling behind the menu
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const bar = "absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-200";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="md:hidden relative w-9 h-9 rounded-lg grid place-items-center text-blue-900 dark:text-blue-100 hover:bg-blue-50 dark:hover:bg-blue-900/30"
      >
        <span className="relative block w-5 h-4" aria-hidden="true">
          <span className={`${bar} ${open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"}`} />
          <span className={`${bar} top-1/2 -translate-y-1/2 ${open ? "opacity-0" : ""}`} />
          <span className={`${bar} ${open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"}`} />
        </span>
      </button>

      {open && createPortal(
        <div className="md:hidden">
          {/* tap outside to close; starts below the header so the toggle button stays usable */}
          <div className="fixed inset-x-0 top-[69px] bottom-0 z-40 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <nav
            id="mobile-nav"
            ref={panelRef}
            tabIndex={-1}
            aria-label="Main menu"
            className="mobile-nav-panel fixed right-0 top-[69px] bottom-0 z-40 w-64 max-w-[80vw] overflow-y-auto bg-white dark:bg-[#0a0f1e] border-l border-blue-100 dark:border-blue-900 shadow-2xl p-3 outline-none flex flex-col gap-1"
          >
            {links.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider ${active ? "bg-blue-900 text-white" : "text-blue-900 dark:text-blue-100 hover:bg-blue-50 dark:hover:bg-blue-900/30"}`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>,
        document.body
      )}
    </>
  );
}