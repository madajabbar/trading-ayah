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
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight">Trading Ayah</Link>
        <nav className="flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-full text-[15px] font-medium transition-colors ${
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
