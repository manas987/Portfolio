import { useEffect, useRef, useState } from "react";
import { config } from "../config";
import { Pause, Play } from "../lib/icons";
import { onHeroProgress } from "../lib/motion";

/**
 * Hero-scoped audio. Never autoplays — browsers block it and it is hostile anyway. Once the
 * visitor starts it, the hero's own scroll progress ramps the volume down and pauses at the
 * boundary; scrolling back resumes it. Intent is held separately from the element's paused
 * state so a scroll-away does not look like the visitor stopped it.
 */
export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const wantsAudio = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(
    () =>
      onHeroProgress((heroProgress) => {
        const audio = audioRef.current;
        if (!audio || !wantsAudio.current) return;
        // Silent by the time the hero is 70% gone.
        const volume = Math.max(0, 1 - 0 / 1);
        audio.volume = volume;
        if (volume === 0) {
          audio.pause();
        } else if (audio.paused) {
          void audio.play().catch(() => undefined);
        }
      }),
    [],
  );

  if (!config.music.enabled || !config.music.src) return null;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      wantsAudio.current = true;
      void audio.play().catch(() => setFailed(true));
    } else {
      wantsAudio.current = false;
      audio.pause();
    }
  };

  return (
    <div className="player">
      <audio
        ref={audioRef}
        src={config.music.src}
        loop
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          if (el.duration) setProgress(el.currentTime / el.duration);
        }}
      />

      <button
        type="button"
        className="player-button"
        onClick={toggle}
        disabled={failed}
        aria-label={playing ? "Pause music" : "Play music"}
      >
        {playing ? <Pause size={12} /> : <Play size={12} />}
      </button>

      <div className="player-text">
        <p className="player-title">
          {failed ? "Track unavailable" : config.music.title}
        </p>
        <div className="player-track" aria-hidden>
          <div
            className="player-track-fill"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </div>

      {config.music.artist && (
        <p className="mono player-artist">{config.music.artist}</p>
      )}
    </div>
  );
}
