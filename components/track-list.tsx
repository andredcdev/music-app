"use client";

import { useState } from "react";
import type { Track } from "@/lib/deezer";
import type { Playlist } from "@/lib/store";
import { Spinner, usePlayer } from "./player";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function TrackList({
  tracks,
  onRemove,
  subtitles,
}: {
  tracks: Track[];
  /** When set, shows a remove button instead of "add to playlist". */
  onRemove?: (track: Track) => void;
  /** Optional extra line per track, keyed by track id. */
  subtitles?: Record<number, string>;
}) {
  const { current, playing, loading, play } = usePlayer();

  if (tracks.length === 0) return <p className="text-sm text-zinc-500">No songs here yet.</p>;

  return (
    <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10">
      {tracks.map((track, i) => {
        const active = current?.id === track.id;
        const buffering = active && loading;
        return (
          <li
            key={track.id}
            className={`group flex items-center gap-3 px-3 py-2 transition hover:bg-white/5 ${active ? "bg-emerald-500/10" : ""}`}
          >
            <button
              onClick={() => play(track, tracks)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              title="Play preview"
            >
              <span className="flex w-6 justify-end text-sm tabular-nums text-zinc-500">
                {buffering ? <Spinner className="h-3.5 w-3.5 text-emerald-400" /> : active && playing ? "♪" : i + 1}
              </span>
              <span className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={track.cover} alt="" className="h-11 w-11 rounded object-cover" />
                {buffering ? (
                  <span className="absolute inset-0 flex items-center justify-center rounded bg-black/60 text-white">
                    <Spinner className="h-5 w-5" />
                  </span>
                ) : (
                  <span className="absolute inset-0 hidden items-center justify-center rounded bg-black/50 text-white group-hover:flex">
                    ▶
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className={`block truncate font-medium ${active ? "text-emerald-400" : ""}`}>
                  {track.title}
                </span>
                <span className="block truncate text-sm text-zinc-400">
                  {track.artist} · {track.album}
                </span>
                {subtitles?.[track.id] && (
                  <span className="block text-xs text-zinc-500">{subtitles[track.id]}</span>
                )}
              </span>
            </button>
            <span className="hidden text-sm tabular-nums text-zinc-500 sm:block">{fmt(track.duration)}</span>
            {onRemove ? (
              <button className="btn-ghost" onClick={() => onRemove(track)}>Remove</button>
            ) : (
              <AddToPlaylist track={track} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function AddToPlaylist({ track }: { track: Track }) {
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function toggle() {
    setOpen((o) => !o);
    setStatus(null);
    if (!playlists) {
      const res = await fetch("/api/playlists");
      if (res.ok) setPlaylists((await res.json()).playlists);
    }
  }

  async function add(p: Playlist) {
    const res = await fetch(`/api/playlists/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addTrack: track }),
    });
    setStatus(res.ok ? `Added to ${p.name}` : "Failed to add");
    setTimeout(() => setOpen(false), 900);
  }

  async function createAndAdd() {
    const name = prompt("New playlist name");
    if (!name?.trim()) return;
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return setStatus("Failed to create playlist");
    const { playlist } = await res.json();
    setPlaylists((ps) => [playlist, ...(ps ?? [])]);
    await add(playlist);
  }

  return (
    <div className="relative">
      <button className="btn-ghost" onClick={toggle} aria-label="Add to playlist">＋</button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-white/10 bg-[#16161f] p-1 shadow-xl">
          {status ? (
            <p className="px-3 py-2 text-sm text-emerald-400">{status}</p>
          ) : (
            <>
              <p className="px-3 py-1 text-xs uppercase tracking-wide text-zinc-500">Add to playlist</p>
              {playlists === null && (
                <p className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400">
                  <Spinner className="h-3.5 w-3.5 text-emerald-400" /> Loading playlists…
                </p>
              )}
              {playlists?.map((p) => (
                <button
                  key={p.id}
                  onClick={() => add(p)}
                  className="block w-full truncate rounded px-3 py-2 text-left text-sm hover:bg-white/10"
                >
                  {p.name}
                </button>
              ))}
              <button
                onClick={createAndAdd}
                className="block w-full rounded px-3 py-2 text-left text-sm text-emerald-400 hover:bg-white/10"
              >
                + New playlist
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
