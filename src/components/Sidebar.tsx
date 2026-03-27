"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Home", icon: "📊" },
  { href: "/pessoas", label: "Pessoas", icon: "👥" },
  { href: "/financeiro", label: "Financeiro", icon: "💰" },
  { href: "/cultos", label: "Cultos", icon: "⛪" },
  { href: "/grupos", label: "Grupos", icon: "🏘️" },
  { href: "/voluntarios", label: "Voluntários", icon: "🙋" },
  { href: "/musicas", label: "Músicas", icon: "🎵" },
  { href: "/kids", label: "Kids", icon: "👶" },
  { href: "/config", label: "Configurações", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#111111] text-white flex flex-col min-h-screen fixed left-0 top-0 bottom-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">
            ⛪
          </div>
          <div>
            <h1 className="font-bold text-sm">Igreja Teste</h1>
            <p className="text-[10px] text-white/40">Dashboard Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
            A
          </div>
          <div>
            <p className="text-xs font-medium">Administrador</p>
            <p className="text-[10px] text-white/40">admin@igreja.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
