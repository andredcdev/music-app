import { Suspense } from "react";
import { getPreferences } from "@/lib/store";
import { requireSession } from "@/lib/session";
import { GenerateClient } from "./generate-client";

export default function GeneratePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Picks ✨</h1>
        <p className="text-zinc-400">
          Tell us what you like and AI will recommend songs. Click any song to play it.
        </p>
      </div>
      <Suspense fallback={<p className="animate-pulse text-zinc-500">Loading…</p>}>
        <Generate />
      </Suspense>
    </div>
  );
}

async function Generate() {
  const { user } = await requireSession();
  const prefs = await getPreferences(user.id);
  return <GenerateClient initial={{ genres: prefs.genres, artists: prefs.artists, mood: prefs.mood }} />;
}
