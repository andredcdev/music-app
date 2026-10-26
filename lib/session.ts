import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/** Full session check for pages: redirects to /login when signed out. Deduped per request. */
export const requireSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
});

/** Session check for API routes: returns null when signed out. */
export async function getApiSession(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}

export const unauthorized = () =>
  Response.json({ error: "Unauthorized" }, { status: 401 });
