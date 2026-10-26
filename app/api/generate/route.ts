import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { findTrack } from "@/lib/deezer";
import { savePreferences } from "@/lib/store";
import { getApiSession, unauthorized } from "@/lib/session";

// Cheapest OpenAI model.
const MODEL = "gpt-5-nano";

const openai = new OpenAI(); // reads OPENAI_API_KEY from .env

const list = z.array(z.string().trim().min(1).max(60)).max(20);
const RequestBody = z.object({
  genres: list.default([]),
  artists: list.default([]),
  mood: z.string().trim().max(200).default(""),
  notes: z.string().trim().max(500).default(""),
  count: z.number().int().min(3).max(15).default(8),
});

const Recommendations = z.object({
  songs: z.array(
    z.object({
      title: z.string(),
      artist: z.string(),
      reason: z.string(),
    }),
  ),
});

export async function POST(request: Request) {
  const session = await getApiSession(request);
  if (!session) return unauthorized();

  const body = RequestBody.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid input" }, { status: 400 });
  const input = body.data;

  // Remember what the user asked for as their preferences.
  await savePreferences(session.user.id, {
    genres: input.genres,
    artists: input.artists,
    mood: input.mood,
  });

  const prompt = [
    `Recommend ${input.count} real, existing songs for this listener.`,
    input.genres.length && `Favourite genres: ${input.genres.join(", ")}`,
    input.artists.length && `Favourite artists: ${input.artists.join(", ")}`,
    input.mood && `Current mood / occasion: ${input.mood}`,
    input.notes && `Extra notes: ${input.notes}`,
    "Mix well-known tracks with a few deeper cuts. Use the exact official song title and primary artist name so the song can be found on a streaming service. Keep each reason to one short sentence.",
  ]
    .filter(Boolean)
    .join("\n");

  let songs: z.infer<typeof Recommendations>["songs"];
  try {
    const response = await openai.responses.parse({
      model: MODEL,
      reasoning: { effort: "minimal" },
      input: prompt,
      text: { format: zodTextFormat(Recommendations, "recommendations") },
    });
    if (!response.output_parsed) {
      return Response.json({ error: "The model could not produce recommendations." }, { status: 502 });
    }
    songs = response.output_parsed.songs;
  } catch (err) {
    if (err instanceof OpenAI.AuthenticationError) {
      return Response.json({ error: "OpenAI API key is invalid." }, { status: 500 });
    }
    if (err instanceof OpenAI.RateLimitError) {
      return Response.json({ error: "Rate limited by OpenAI, try again shortly." }, { status: 429 });
    }
    if (err instanceof OpenAI.APIError) {
      console.error("OpenAI API error", err.status, err.message);
      return Response.json({ error: "Recommendation service failed." }, { status: 502 });
    }
    throw err;
  }

  // Resolve each suggestion to a playable Deezer track.
  const results = await Promise.all(
    songs.map(async (s) => ({ ...s, track: await findTrack(s.title, s.artist).catch(() => null) })),
  );

  return Response.json({ recommendations: results });
}
