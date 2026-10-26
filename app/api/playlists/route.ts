import { z } from "zod";
import { createPlaylist, listPlaylists } from "@/lib/store";
import { getApiSession, unauthorized } from "@/lib/session";

const CreateBody = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
});

// Read all playlists of the current user.
export async function GET(request: Request) {
  const session = await getApiSession(request);
  if (!session) return unauthorized();
  return Response.json({ playlists: await listPlaylists(session.user.id) });
}

// Create a playlist.
export async function POST(request: Request) {
  const session = await getApiSession(request);
  if (!session) return unauthorized();
  const body = CreateBody.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "A playlist name is required" }, { status: 400 });
  const playlist = await createPlaylist(session.user.id, body.data.name, body.data.description);
  return Response.json({ playlist }, { status: 201 });
}
