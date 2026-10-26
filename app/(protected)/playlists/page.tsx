"use client";

import { useEffect, useState } from "react";
import type { Playlist } from "@/lib/store";
import { TrackList } from "@/components/track-list";
import { Spinner } from "@/components/player";

const json = { "Content-Type": "application/json" };

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = playlists?.find((p) => p.id === selectedId) ?? null;

  // READ
  useEffect(() => {
    fetch("/api/playlists")
      .then((r) => r.json())
      .then((d) => {
        setPlaylists(d.playlists);
        setSelectedId(d.playlists[0]?.id ?? null);
      })
      .catch(() => setError("Failed to load playlists"));
  }, []);

  const replace = (p: Playlist) => setPlaylists((ps) => ps!.map((x) => (x.id === p.id ? p : x)));

  // CREATE
  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/playlists", { method: "POST", headers: json, body: JSON.stringify({ name, description }) });
    if (!res.ok) return setError((await res.json()).error);
    const { playlist } = await res.json();
    setPlaylists((ps) => [playlist, ...(ps ?? [])]);
    setSelectedId(playlist.id);
    setName("");
    setDescription("");
  }

  // UPDATE
  async function patch(body: object) {
    if (!selected) return;
    const res = await fetch(`/api/playlists/${selected.id}`, { method: "PATCH", headers: json, body: JSON.stringify(body) });
    if (!res.ok) return setError((await res.json()).error);
    replace((await res.json()).playlist);
  }

  // DELETE
  async function remove() {
    if (!selected || !confirm(`Delete “${selected.name}”?`)) return;
    const res = await fetch(`/api/playlists/${selected.id}`, { method: "DELETE" });
    if (!res.ok) return setError("Failed to delete playlist");
    const rest = playlists!.filter((p) => p.id !== selected.id);
    setPlaylists(rest);
    setSelectedId(rest[0]?.id ?? null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your playlists</h1>
        <p className="text-zinc-400">Create, rename and delete playlists. Add songs from Home or AI Picks with the ＋ button.</p>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <form onSubmit={create} className="card space-y-2">
            <h2 className="font-semibold">New playlist</h2>
            <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input className="input" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
            <button className="btn w-full">Create</button>
          </form>

          <ul className="space-y-1">
            {playlists === null && (
              <li className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400">
                <Spinner className="h-4 w-4 text-emerald-400" /> Loading playlists…
              </li>
            )}
            {playlists?.length === 0 && <li className="text-sm text-zinc-500">No playlists yet.</li>}
            {playlists?.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => { setSelectedId(p.id); setEditing(false); }}
                  className={`w-full rounded-lg px-3 py-2 text-left transition ${p.id === selectedId ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="text-xs text-zinc-500">{p.tracks.length} songs</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section>
          {selected ? (
            <div className="space-y-4">
              {editing ? (
                <EditForm
                  playlist={selected}
                  onCancel={() => setEditing(false)}
                  onSave={async (n, d) => { await patch({ name: n, description: d }); setEditing(false); }}
                />
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold">{selected.name}</h2>
                    {selected.description && <p className="text-zinc-400">{selected.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-ghost" onClick={() => setEditing(true)}>Edit</button>
                    <button className="btn-ghost text-red-400" onClick={remove}>Delete</button>
                  </div>
                </div>
              )}
              <TrackList tracks={selected.tracks} onRemove={(t) => patch({ removeTrackId: t.id })} />
            </div>
          ) : playlists === null ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-white/10">
              <Spinner className="h-8 w-8 text-emerald-400" />
            </div>
          ) : (
            <p className="text-zinc-500">Create a playlist to get started.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function EditForm({
  playlist,
  onSave,
  onCancel,
}: {
  playlist: Playlist;
  onSave: (name: string, description: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(name, description); }} className="card space-y-2">
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="input" value={description} placeholder="Description" onChange={(e) => setDescription(e.target.value)} />
      <div className="flex gap-2">
        <button className="btn">Save</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
