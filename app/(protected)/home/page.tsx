import { Suspense } from "react";
import { getChart } from "@/lib/deezer";
import { requireSession } from "@/lib/session";
import { HomeClient } from "./home-client";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<h1 className="text-3xl font-bold">Hi 👋</h1>}>
        <Greeting />
      </Suspense>
      <Suspense fallback={<p className="animate-pulse text-zinc-500">Loading popular songs…</p>}>
        <Chart />
      </Suspense>
    </div>
  );
}

async function Greeting() {
  const session = await requireSession();
  return (
    <div>
      <h1 className="text-3xl font-bold">Hi {session.user.name.split(" ")[0]} 👋</h1>
      <p className="text-zinc-400">Today&apos;s most popular songs. Click any song to play a preview.</p>
    </div>
  );
}

async function Chart() {
  await requireSession();
  const tracks = await getChart(30).catch(() => []);
  return <HomeClient chart={tracks} />;
}
