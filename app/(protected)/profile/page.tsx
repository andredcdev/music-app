import { Suspense } from "react";
import { getPreferences } from "@/lib/store";
import { requireSession } from "@/lib/session";
import { ProfileForm } from "./profile-form";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-zinc-400">Update your account details and music preferences.</p>
      </div>
      <Suspense fallback={<p className="animate-pulse text-zinc-500">Loading profile…</p>}>
        <Profile />
      </Suspense>
    </div>
  );
}

async function Profile() {
  const { user } = await requireSession();
  const prefs = await getPreferences(user.id);
  return (
    <ProfileForm
      user={{ name: user.name, email: user.email, image: user.image ?? "" }}
      prefs={{ genres: prefs.genres, artists: prefs.artists, mood: prefs.mood, bio: prefs.bio }}
    />
  );
}
