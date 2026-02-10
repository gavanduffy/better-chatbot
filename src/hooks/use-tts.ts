"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

interface UseTTSOptions {
  onError?: (error: Error) => void;
  onPlay?: () => void;
  onEnd?: () => void;
}

interface UseTTSReturn {
  isPlaying: boolean;
  isLoading: boolean;
  error: Error | null;
  play: (text: string) => Promise<void>;
  stop: () => void;
}

export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
  const { onError, onPlay, onEnd } = options;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const play = useCallback(
    async (text: string) => {
      // Stop any currently playing audio
      stop();

      setIsLoading(true);
      setError(null);

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || "Failed to generate speech");
        }

        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        audioUrlRef.current = url;

        const audio = new Audio(url);

        audio.addEventListener("play", () => {
          setIsPlaying(true);
          setIsLoading(false);
          onPlay?.();
        });

        audio.addEventListener("ended", () => {
          setIsPlaying(false);
          onEnd?.();
        });

        audio.addEventListener("error", (e) => {
          const error =
            e.error || new Error("Failed to play audio");
          setError(error);
          setIsPlaying(false);
          onError?.(error);
        });

        audioRef.current = audio;
        await audio.play();
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsLoading(false);
        onError?.(error);
        toast.error(error.message);
      }
    },
    [stop, onError, onPlay, onEnd]
  );

  return {
    isPlaying,
    isLoading,
    error,
    play,
    stop,
  };
}
