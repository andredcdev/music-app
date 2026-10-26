"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export function ProfileForm({
  user,
  prefs,
}: {
  user: { name: string; email: string; image: string };
  prefs: { genres: string[]; artists: string[]; mood: string; bio: string };
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [image, setImage] = useState(user.image);
  const [genres, setGenres] = useState(prefs.genres.join(", "));
  const [artists, setArtists] = useState(prefs.artists.join(", "));
  const [mood, setMood] = useState(prefs.mood);
  const [bio, setBio] = useState(prefs.bio);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const [account, preferences] = await Promise.all([
      authClient.updateUser({ name, image: image || null }),
      fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genres: split(genres), artists: split(artists), mood, bio }),
      }),
    ]);
    setSaving(false);
    if (account.error || !preferences.ok) {
      setStatus({ ok: false, msg: account.error?.message ?? "Failed to save preferences" });
      return;
    }
    setStatus({ ok: true, msg: "Profile saved" });
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="card space-y-3">
        <h2 className="font-semibold">Account</h2>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {image ? <img src={image} alt="" className="h-16 w-16 rounded-full object-cover" /> : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-2xl font-semibold text-emerald-400">
              {name.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div className="text-sm text-zinc-400">{user.email}</div>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Avatar URL</span>
          <input className="input" type="url" placeholder="https://…" value={image} onChange={(e) => setImage(e.target.value)} />
        </label>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Music preferences</h2>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Favourite genres (comma separated)</span>
          <input className="input" placeholder="indie, lo-fi, afrobeats" value={genres} onChange={(e) => setGenres(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Favourite artists (comma separated)</span>
          <input className="input" placeholder="Tame Impala, SZA" value={artists} onChange={(e) => setArtists(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Usual mood</span>
          <input className="input" placeholder="chill late-night drive" value={mood} onChange={(e) => setMood(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">About you</span>
          <textarea className="input min-h-20" value={bio} onChange={(e) => setBio(e.target.value)} />
        </label>
      </section>

      <div className="flex items-center gap-3">
        <button className="btn" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
        {status && <span className={`text-sm ${status.ok ? "text-emerald-400" : "text-red-400"}`}>{status.msg}</span>}
      </div>
    </form>
  );
}
