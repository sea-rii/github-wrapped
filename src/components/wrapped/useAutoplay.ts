"use client";

import { useEffect, useRef, useState } from "react";

export function useAutoplay(total: number, delayMs = 4500) {
  const [isPlaying, setIsPlaying] = useState(true);
  const timer = useRef<number | null>(null);

  const stop = () => setIsPlaying(false);
  const play = () => setIsPlaying(true);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  const bind = (onTick: () => void) => {
    useEffect(() => {
      if (timer.current) window.clearInterval(timer.current);

      if (!isPlaying) return;

      timer.current = window.setInterval(() => {
        onTick();
      }, delayMs);

      return () => {
        if (timer.current) window.clearInterval(timer.current);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying, total, delayMs]);
  };

  return { isPlaying, play, stop, bind };
}
