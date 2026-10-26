"use client";

import { useState } from "react";
import type { Track } from "@/lib/deezer";
import { TrackList } from "@/components/track-list";

type Recommendation = { title: string; artist: string; reason: string; track: Track | null };

const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export function GenerateClient({
  initial,
}: {
  initial: { genres: string[]; artists: string[]; mood: string };
}) {
  const [genres, setGenres] = useState(initial.genres.join(", "));
  const [artists, setArtists] = useState(initial.artists.join(", "));
  const [mood, setMood] = useState(initial.mood);
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recs, setRecs] = useState<Recommendation[] | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genres: split(genres), artists: split(artists), mood, notes, count }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Failed to generate recommendations");
    setRecs(data.recommendations);
  }

  const playable = recs?.filter((r): r is Recommendation & { track: Track } => r.track !== null) ?? [];
  const missing = recs?.filter((r) => !r.track) ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <form onSubmit={generate} className="card h-fit space-y-3">
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Genres you like</span>
          <input className="input" placeholder="indie rock, neo-soul" value={genres} onChange={(e) => setGenres(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Artists you like</span>
          <input className="input" placeholder="Arctic Monkeys, Daniel Caesar" value={artists} onChange={(e) => setArtists(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Mood or occasion</span>
          <input className="input" placeholder="rainy Sunday morning" value={mood} onChange={(e) => setMood(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Anything else?</span>
          <textarea className="input min-h-20" placeholder="Nothing too sad, prefer 2010s+" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">How many songs: {count}</span>
          <input type="range" min={3} max={15} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-emerald-500" />
        </label>
        <button className="btn w-full" disabled={loading}>{loading ? "Asking AI…" : "Generate recommendations"}</button>
        <p className="text-xs text-zinc-500">Your genres, artists and mood are saved to your profile.</p>
      </form>

      <section className="space-y-3">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!recs && !loading && <p className="text-zinc-500">Your recommendations will appear here.</p>}
        {loading && <p className="animate-pulse text-zinc-400">Finding songs you&apos;ll love…</p>}
        {recs && !loading && (
          <>
            <h2 className="text-lg font-semibold">Recommended for you</h2>
            <TrackList
              tracks={playable.map((r) => r.track)}
              subtitles={Object.fromEntries(playable.map((r) => [r.track.id, r.reason]))}
            />
            {missing.length > 0 && (
              <div className="text-sm text-zinc-500">
                <p>Not found on Deezer:</p>
                <ul className="list-disc pl-5">
                  {missing.map((r) => <li key={`${r.artist}-${r.title}`}>{r.title} by {r.artist}</li>)}
                </ul>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
