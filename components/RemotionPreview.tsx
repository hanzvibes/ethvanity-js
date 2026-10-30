"use client";

import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import {
  EthvanityPreview,
  PREVIEW_DURATION_IN_FRAMES,
  PREVIEW_FPS,
  PREVIEW_HEIGHT,
  PREVIEW_WIDTH,
} from "../remotion/EthvanityPreview";

export default function RemotionPreview() {
  const playerRef = useRef<PlayerRef>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const restart = () => {
    playerRef.current?.seekTo(0);
    playerRef.current?.play();
  };

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#171915] shadow-2xl">
        <Player
          ref={playerRef}
          component={EthvanityPreview}
          durationInFrames={PREVIEW_DURATION_IN_FRAMES}
          compositionWidth={PREVIEW_WIDTH}
          compositionHeight={PREVIEW_HEIGHT}
          fps={PREVIEW_FPS}
          controls
          loop
          autoPlay={!reducedMotion}
          clickToPlay
          acknowledgeRemotionLicense
          style={{ width: "100%" }}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-neutral-500">
          Durasi 10 detik · 1280×720 · 30 fps · berputar otomatis, kecuali kalau perangkatmu disetel kurangi gerakan.
        </p>
        <button
          type="button"
          onClick={restart}
          className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold transition hover:border-lime-500 hover:text-lime-700"
        >
          Putar dari awal ↻
        </button>
      </div>
    </div>
  );
}
