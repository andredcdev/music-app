"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } =
      mode === "signin"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ name, email, password });
    setLoading(false);
    if (error) return setError(error.message ?? "Something went wrong");
    router.push("/home");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-4xl">♫</p>
          <h1 className="mt-2 text-2xl font-bold">
            {mode === "signin" ? "Welcome back to Tunely" : "Create your Tunely account"}
          </h1>
          <p className="text-sm text-zinc-400">Sign in to see popular songs and get AI picks.</p>
        </div>

        <form onSubmit={submit} className="card space-y-3">
          {mode === "signup" && (
            <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password (min 8 characters)"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button className="btn w-full" disabled={loading}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-400">
          {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
          <button
            className="text-emerald-400 hover:underline"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}
