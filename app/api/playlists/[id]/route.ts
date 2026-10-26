import { z } from "zod";
import { deletePlaylist, getPlaylist, updatePlaylist } from "@/lib/store";
import { getApiSession, unauthorized } from "@/lib/session";

type Ctx = RouteContext<"/api/playlists/[id]">;

const TrackSchema = z.object({
  id: z.number(),
  title: z.string(),
  artist: z.string(),
  album: z.string(),
  cover: z.string(),
  duration: z.number(),
  link: z.string(),
});

const UpdateBody = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  addTrack: TrackSchema.optional(),
  removeTrackId: z.number().optional(),
});

const notFound = () => Response.json({ error: "Playlist not found" }, { status: 404 });

export async function GET(request: Request, ctx: Ctx) {
  const session = await getApiSession(request);
  if (!session) return unauthorized();
  const playlist = await getPlaylist(session.user.id, (await ctx.params).id);
  return playlist ? Response.json({ playlist }) : notFound();
}

// Rename / edit description / add a track / remove a track.
export async function PATCH(request: Request, ctx: Ctx) {
  const session = await getApiSession(request);
  if (!session) return unauthorized();
  const body = UpdateBody.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid update" }, { status: 400 });
  const playlist = await updatePlaylist(session.user.id, (await ctx.params).id, body.data);
  return playlist ? Response.json({ playlist }) : notFound();
}

export async function DELETE(request: Request, ctx: Ctx) {
  const session = await getApiSession(request);
  if (!session) return unauthorized();
  const ok = await deletePlaylist(session.user.id, (await ctx.params).id);
  return ok ? new Response(null, { status: 204 }) : notFound();
}
