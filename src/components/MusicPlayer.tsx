import { useEffect, useRef, useState } from "react";
import { config } from "../config";
import { useLiquidGlass } from "../lib/glass";
import { SoundOff, SoundOn } from "../lib/icons";
import { onHeroProgress } from "../lib/motion";

/**
 * Background music for the home page, on by default. Browsers refuse audio with sound until
 * the visitor's first click, tap or key press (scrolling does not count), so it tries once on
 * load and otherwise starts on that first gesture. The hero's scroll progress ramps the volume
 * down and pauses it at the boundary; scrolling back resumes it. The toggle is the required
 * way to stop background audio, and a mute is remembered for the next visit.
 */
// The track itself is mastered 26 dB down (public/audio/track.mp3; original kept as
// track-original.mp3), so the level holds even if an extension ignores element volume.
const MAX_VOLUME = 1;
const MUTE_KEY = "music-muted";

const readMuted = () => {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
};

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useLiquidGlass(buttonRef, { bezel: 9, scale: 16 });
  const [muted, setMuted] = useState(readMuted);
  // Whether the browser has let it start yet; until then the hero can't resume it.
  const started = useRef(false);
  const heroProgress = useRef(0);

  const volumeFor = (progress: number) => MAX_VOLUME * Math.max(0, 1 - progress / 0.7);

  // Start on load if the browser allows it, otherwise on the first real gesture.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || muted) return;
    const tryPlay = () => {
      if (volumeFor(heroProgress.current) === 0) return;
      audio.volume = volumeFor(heroProgress.current);
      void audio.play().catch(() => undefined);
    };
    tryPlay();
    const events = ["pointerdown", "keydown", "touchend"] as const;
    const onGesture = () => {
      tryPlay();
      events.forEach((e) => window.removeEventListener(e, onGesture));
    };
    events.forEach((e) => window.addEventListener(e, onGesture, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, onGesture));
  }, [muted]);

  useEffect(
    () =>
      onHeroProgress((progress) => {
        heroProgress.current = progress;
        const audio = audioRef.current;
        if (!audio || muted) return;
        const volume = volumeFor(progress);
        audio.volume = volume;
        if (volume === 0) audio.pause();
        else if (audio.paused && started.current) void audio.play().catch(() => undefined);
      }),
    [muted],
  );

  if (!config.music.enabled || !config.music.src) return null;

  const toggle = () => {
    const audio = audioRef.current;
    const next = !muted;
    setMuted(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      // Private mode: the choice just isn't remembered.
    }
    if (!audio) return;
    if (next) audio.pause();
    else {
      audio.volume = volumeFor(heroProgress.current) || MAX_VOLUME;
      void audio.play().catch(() => undefined);
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={config.music.src}
        loop
        preload="auto"
        onPlay={() => {
          started.current = true;
        }}
      />
      <button
        ref={buttonRef}
        type="button"
        className="sound-toggle glass"
        onClick={toggle}
        aria-pressed={!muted}
        aria-label={muted ? "Turn music on" : "Turn music off"}>
        {muted ? <SoundOff size={15} /> : <SoundOn size={15} />}
      </button>
    </>
  );
}
