import { getChart } from "@/lib/deezer";
import { getApiSession, unauthorized } from "@/lib/session";

export async function GET(request: Request) {
  if (!(await getApiSession(request))) return unauthorized();
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 30);
  return Response.json({ tracks: await getChart(Math.min(Math.max(limit, 1), 100)) });
}
