import { Suspense } from "react";
import { Nav } from "@/components/nav";
import { requireSession } from "@/lib/session";

// Every page in this group requires a signed-in user. The session is read at
// request time, so it streams in behind a Suspense boundary (Cache Components).
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-zinc-500">Loading…</p>}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}

async function AuthGate({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <>
      <Nav userName={session.user.name} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
