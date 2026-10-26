"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "./player";

const links = [
  { href: "/home", label: "Home" },
  { href: "/playlists", label: "Playlists" },
  { href: "/generate", label: "AI Picks" },
  { href: "/profile", label: "Profile" },
];

export function Nav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    // Full page load (not client navigation) so cached signed-in pages, the
    // player and Back-button history from this session are all discarded.
    window.location.replace("/login");
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
          <button className="btn-ghost" onClick={signOut} disabled={signingOut} aria-busy={signingOut}>
            {signingOut ? (
              <>
                <Spinner className="h-3.5 w-3.5" /> Signing out…
              </>
            ) : (
              "Sign out"
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
