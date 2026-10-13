import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import MobileNav from "./MobileNav";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/activities", label: "Activities" },
  { href: "/news", label: "News" },
  { href: "/media", label: "Media" },
  { href: "/team", label: "Team" },
  { href: "/clubs", label: "Clubs" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 dark:bg-[#0a0f1e]/85 border-b border-blue-100 dark:border-blue-900">
      {/* three columns: logo | links (truly centred) | buttons */}
      <div className="max-w-6xl mx-auto h-[68px] px-4 grid grid-cols-[1fr_auto_1fr] items-center">
        <Link href="/" className="justify-self-start font-black uppercase tracking-wide text-blue-900 dark:text-blue-100">
          MRIS Council
        </Link>

        <nav aria-label="Main" className="hidden lg:flex items-center">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-100 hover:text-blue-600">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="col-start-3 justify-self-end flex items-center gap-1">
          <Link href="/restricted" className="w-9 h-9 rounded-lg grid place-items-center text-blue-900 dark:text-blue-100 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Staff login" aria-label="Staff login"><span aria-hidden="true">🔒</span></Link>
          <ThemeToggle />
          <MobileNav links={LINKS} />
        </div>
      </div>
    </header>
  );
}