"use client";

import { useState } from "react";
import type { Track } from "@/lib/deezer";
import { TrackList } from "@/components/track-list";

export function HomeClient({ chart }: { chart: Track[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return setResults(null);
    setLoading(true);
    const res = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`);
    setResults(res.ok ? (await res.json()).tracks : []);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={search} className="flex gap-2">
        <input
          className="input"
          placeholder="Search songs, artists, albums…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn" disabled={loading}>{loading ? "Searching…" : "Search"}</button>
        {results && (
          <button type="button" className="btn-ghost" onClick={() => { setResults(null); setQuery(""); }}>
            Clear
          </button>
        )}
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{results ? `Results for “${query}”` : "🔥 Popular right now"}</h2>
        {chart.length === 0 && !results ? (
          <p className="text-sm text-red-400">Couldn&apos;t load the chart from Deezer. Try refreshing.</p>
        ) : (
          <TrackList tracks={results ?? chart} />
        )}
      </section>
    </div>
  );
}
