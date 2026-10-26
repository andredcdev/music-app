import { ObjectId } from "mongodb";
import { db } from "./db";
import type { Track } from "./deezer";

export type Preferences = {
  userId: string;
  genres: string[];
  artists: string[];
  mood: string;
  bio: string;
  updatedAt?: Date;
};

type PlaylistDoc = {
  _id: ObjectId;
  userId: string;
  name: string;
  description: string;
  tracks: Track[];
  createdAt: Date;
  updatedAt: Date;
};

export type Playlist = Omit<PlaylistDoc, "_id" | "userId"> & { id: string };

const preferences = db.collection<Preferences>("preferences");
const playlists = db.collection<PlaylistDoc>("playlists");

const toPlaylist = (doc: PlaylistDoc): Playlist => ({
  id: doc._id.toHexString(),
  name: doc.name,
  description: doc.description,
  tracks: doc.tracks,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const parseId = (id: string) => (ObjectId.isValid(id) ? new ObjectId(id) : null);

// ---------- Preferences ----------

export async function getPreferences(userId: string): Promise<Preferences> {
  const doc = await preferences.findOne({ userId }, { projection: { _id: 0 } });
  return { userId, genres: [], artists: [], mood: "", bio: "", ...doc };
}

export async function savePreferences(
  userId: string,
  prefs: Partial<Omit<Preferences, "userId">>,
) {
  await preferences.updateOne(
    { userId },
    { $set: { ...prefs, updatedAt: new Date() } },
    { upsert: true },
  );
  return getPreferences(userId);
}

// ---------- Playlists (CRUD) ----------

export async function listPlaylists(userId: string): Promise<Playlist[]> {
  const docs = await playlists.find({ userId }).sort({ updatedAt: -1 }).toArray();
  return docs.map(toPlaylist);
}

export async function createPlaylist(userId: string, name: string, description = "") {
  const now = new Date();
  const doc: PlaylistDoc = {
    _id: new ObjectId(),
    userId,
    name,
    description,
    tracks: [],
    createdAt: now,
    updatedAt: now,
  };
  await playlists.insertOne(doc);
  return toPlaylist(doc);
}

export async function getPlaylist(userId: string, id: string) {
  const _id = parseId(id);
  if (!_id) return null;
  const doc = await playlists.findOne({ _id, userId });
  return doc ? toPlaylist(doc) : null;
}

export async function updatePlaylist(
  userId: string,
  id: string,
  change: { name?: string; description?: string; addTrack?: Track; removeTrackId?: number },
) {
  const _id = parseId(id);
  if (!_id) return null;
  const update: Record<string, unknown> = { $set: { updatedAt: new Date() } };
  const set = update.$set as Record<string, unknown>;
  if (change.name !== undefined) set.name = change.name;
  if (change.description !== undefined) set.description = change.description;
  // Skip adding a track that is already in the playlist.
  const filter: Record<string, unknown> = { _id, userId };
  if (change.addTrack) {
    update.$push = { tracks: change.addTrack };
    filter["tracks.id"] = { $ne: change.addTrack.id };
  }
  if (change.removeTrackId !== undefined) update.$pull = { tracks: { id: change.removeTrackId } };
  await playlists.updateOne(filter, update);
  return getPlaylist(userId, id);
}

export async function deletePlaylist(userId: string, id: string) {
  const _id = parseId(id);
  if (!_id) return false;
  const res = await playlists.deleteOne({ _id, userId });
  return res.deletedCount === 1;
}
