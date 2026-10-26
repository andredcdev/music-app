import { getPreviewUrl } from "@/lib/deezer";
import { getApiSession, unauthorized } from "@/lib/session";

// Redirects to a freshly signed Deezer preview so saved tracks always play.
export async function GET(request: Request, ctx: RouteContext<"/api/music/preview/[id]">) {
  if (!(await getApiSession(request))) return unauthorized();
  const { id } = await ctx.params;
  const url = await getPreviewUrl(Number(id));
  if (!url) return Response.json({ error: "No preview available" }, { status: 404 });
  return Response.redirect(url, 302);
}
