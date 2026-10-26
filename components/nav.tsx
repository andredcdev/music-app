"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const links = [
  { href: "/home", label: "Home" },
  { href: "/playlists", label: "Playlists" },
  { href: "/generate", label: "AI Picks" },
  { href: "/profile", label: "Profile" },
];

export function Nav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3">
        <Link href="/home" className="mr-4 text-lg font-semibold">
          <span className="text-emerald-400">♫</span> Tunely
        </Link>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              pathname.startsWith(l.href) ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-zinc-400 sm:block">{userName}</span>
          <button className="btn-ghost" onClick={signOut}>Sign out</button>
        </div>
      </nav>
    </header>
  );
}
