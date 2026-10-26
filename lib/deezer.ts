// Deezer public API: free, no key required. Previews are 30-second MP3 clips.
const BASE = "https://api.deezer.com";

export type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration: number;
  link: string;
};

type DeezerTrack = {
  id: number;
  title: string;
  duration: number;
  link: string;
  preview: string;
  artist: { name: string };
  album: { title: string; cover_medium: string };
};

function toTrack(t: DeezerTrack): Track {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist.name,
    album: t.album.title,
    cover: t.album.cover_medium,
    duration: t.duration,
    link: t.link,
  };
}

async function deezer<T>(path: string, revalidate = 600): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`Deezer request failed: ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`Deezer error: ${json.error.message}`);
  return json as T;
}

export async function getChart(limit = 30): Promise<Track[]> {
  const json = await deezer<{ data: DeezerTrack[] }>(`/chart/0/tracks?limit=${limit}`);
  return json.data.map(toTrack);
}

export async function searchTracks(q: string, limit = 20): Promise<Track[]> {
  const json = await deezer<{ data: DeezerTrack[] }>(
    `/search?q=${encodeURIComponent(q)}&limit=${limit}`,
  );
  return json.data.map(toTrack);
}

export async function findTrack(title: string, artist: string): Promise<Track | null> {
  const [first] = await searchTracks(`${artist} ${title}`, 1);
  return first ?? null;
}

/** Fresh preview URL (Deezer preview links are signed and expire). */
export async function getPreviewUrl(id: number): Promise<string | null> {
  const t = await deezer<DeezerTrack>(`/track/${id}`, 0);
  return t.preview || null;
}
