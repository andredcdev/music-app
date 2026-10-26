"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Track } from "@/lib/deezer";

type PlayerState = {
  current: Track | null;
  playing: boolean;
  /** True while the current track is buffering and has not started playing yet. */
  loading: boolean;
  play: (track: Track, queue?: Track[]) => void;
  toggle: () => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const play = useCallback(
    (track: Track, newQueue?: Track[]) => {
      if (newQueue) setQueue(newQueue);
      if (current?.id === track.id && audioRef.current) {
        audioRef.current.play();
        return;
      }
      setError(null);
      setCurrent(track);
    },
    [current],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) audio.play();
    else audio.pause();
  }, [current]);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!current || queue.length === 0) return;
      const i = queue.findIndex((t) => t.id === current.id);
      const next = queue[(i + dir + queue.length) % queue.length];
      if (next) setCurrent(next);
    },
    [current, queue],
  );

  // Start playback whenever the selected track changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    setLoading(true);
    audio.src = `/api/music/preview/${current.id}`;
    audio.play().catch((err: DOMException) => {
      // AbortError just means another track was picked before this one loaded.
      if (err.name === "AbortError") return;
      setLoading(false);
      setError("Preview unavailable for this track");
    });
  }, [current]);

  return (
    <PlayerContext.Provider value={{ current, playing, loading, play, toggle }}>
      <div className={current ? "pb-24 flex flex-1 flex-col" : "flex flex-1 flex-col"}>{children}</div>
      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onEnded={() => step(1)}
        onError={() => {
          if (!current) return;
          setLoading(false);
          setError("Preview unavailable for this track");
        }}
      />
      {current && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#111118]/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.cover} alt="" className="h-12 w-12 rounded-md object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{current.title}</p>
              <p className="truncate text-sm text-zinc-400">
                {error ? (
                  <span className="text-red-400">{error}</span>
                ) : loading ? (
                  <span className="text-emerald-400">Loading preview…</span>
                ) : (
                  current.artist
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-ghost" onClick={() => step(-1)} aria-label="Previous">⏮</button>
              <button
                className="btn w-12"
                onClick={toggle}
                aria-label={loading ? "Loading" : playing ? "Pause" : "Play"}
                aria-busy={loading}
              >
                {loading ? <Spinner /> : playing ? "❚❚" : "▶"}
              </button>
              <button className="btn-ghost" onClick={() => step(1)} aria-label="Next">⏭</button>
            </div>
            <a
              href={current.link}
              target="_blank"
              rel="noreferrer"
              className="hidden text-sm text-emerald-400 hover:underline sm:block"
            >
              Full song on Deezer ↗
            </a>
          </div>
        </div>
      )}
    </PlayerContext.Provider>
  );
}
