import { searchTracks } from "@/lib/deezer";
import { getApiSession, unauthorized } from "@/lib/session";

export async function GET(request: Request) {
  if (!(await getApiSession(request))) return unauthorized();
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return Response.json({ tracks: [] });
  return Response.json({ tracks: await searchTracks(q) });
}
