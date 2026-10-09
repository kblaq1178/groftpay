import Link from "next/link";

import { GroftyConnectButton } from "@/components/grofty/connect-button";
import { GroftPayWordmark } from "@/components/ui/logo";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/profile", label: "Profiles" },
  { href: "/profile/create", label: "Create profile" },
  { href: "/history", label: "History" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink-950/72 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-5 sm:px-8">
        <Link href="/" className="shrink-0 rounded-xl transition hover:opacity-90">
          <GroftPayWordmark />
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-[0.8125rem] font-medium text-mist-400 transition hover:bg-white/[0.05] hover:text-mist-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <Link
            href="/#create"
            className="hidden rounded-full px-3.5 py-2 text-[0.8125rem] font-medium text-mist-300 transition hover:bg-white/[0.05] hover:text-mist-100 sm:inline-flex"
          >
            Create request
          </Link>
          <GroftyConnectButton />
        </div>
      </div>
    </header>
  );
}