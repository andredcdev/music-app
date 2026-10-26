import { z } from "zod";
import { getPreferences, savePreferences } from "@/lib/store";
import { getApiSession, unauthorized } from "@/lib/session";

const list = z.array(z.string().trim().min(1).max(60)).max(20);
const PrefsBody = z.object({
  genres: list.optional(),
  artists: list.optional(),
  mood: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(500).optional(),
});

export async function GET(request: Request) {
  const session = await getApiSession(request);
  if (!session) return unauthorized();
  return Response.json({ preferences: await getPreferences(session.user.id) });
}

export async function PUT(request: Request) {
  const session = await getApiSession(request);
  if (!session) return unauthorized();
  const body = PrefsBody.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid preferences" }, { status: 400 });
  return Response.json({ preferences: await savePreferences(session.user.id, body.data) });
}
