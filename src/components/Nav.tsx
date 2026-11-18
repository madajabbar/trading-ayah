"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/chart/XAUUSD", label: "Chart" },
  { href: "/sinyal", label: "Sinyal" },
  { href: "/kalkulator", label: "Kalkulator" },
  { href: "/pengaturan", label: "Pengaturan" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-neutral-200">
      <div className="max-w-5xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="font-bold text-lg tracking-tight">XAU Pro</span>
          <span className="text-[11px] text-neutral-400 font-normal">Sinyal Emas & Forex untuk Ayah</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-full text-[15px] font-medium transition-colors ${
                path === l.href || (l.href === "/chart/XAUUSD" && path.startsWith("/chart"))
                  ? "bg-neutral-100 text-black"
                  : "text-neutral-500 hover:text-black hover:bg-neutral-50"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
