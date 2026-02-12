import { appStore } from "@/app/store";
import { useCallback, useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";

export function useTTS() {
  const [ttsSettings] = appStore(useShallow((state) => [state.ttsSettings]));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!ttsSettings?.baseUrl || !ttsSettings?.apiKey || !ttsSettings?.model) {
        toast.error("Please configure TTS settings in Chat Preferences.");
        return;
      }

      stop();
      setIsLoading(true);
      abortControllerRef.current = new AbortController();

      try {
        // Chunk text
        const maxChars = 1980;
        const chunks: string[] = [];
        let remaining = text;
        while (remaining.length > 0) {
          if (remaining.length <= maxChars) {
            chunks.push(remaining);
            break;
          }
          let chunk = remaining.slice(0, maxChars);
          // Try to split at sentence end or punctuation
          const lastPeriod = chunk.lastIndexOf(".");
          const lastComma = chunk.lastIndexOf(",");
          const lastSpace = chunk.lastIndexOf(" ");

          let splitIndex = maxChars;
          if (lastPeriod > maxChars * 0.5) splitIndex = lastPeriod + 1;
          else if (lastComma > maxChars * 0.5) splitIndex = lastComma + 1;
          else if (lastSpace > maxChars * 0.5) splitIndex = lastSpace + 1;

          chunks.push(remaining.slice(0, splitIndex));
          remaining = remaining.slice(splitIndex);
        }

        setIsPlaying(true);

        for (const chunk of chunks) {
          if (abortControllerRef.current?.signal.aborted) break;

          const response = await fetch(`${ttsSettings.baseUrl.replace(/\/$/, "")}/v1/audio/speech`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ttsSettings.apiKey}`,
            },
            body: JSON.stringify({
              model: ttsSettings.model,
              input: chunk,
              voice: "alloy", // Default voice
            }),
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) {
            throw new Error(`TTS API error: ${response.statusText}`);
          }

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);

          await new Promise<void>((resolve, reject) => {
            if (abortControllerRef.current?.signal.aborted) {
                reject(new Error("Aborted"));
                return;
            }
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => {
                URL.revokeObjectURL(url);
                resolve();
            };
            audio.onerror = (e) => {
                URL.revokeObjectURL(url);
                reject(e);
            };
            audio.play().catch(reject);
          });
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          toast.error(`TTS Error: ${error.message}`);
          console.error(error);
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
             setIsPlaying(false);
             setIsLoading(false);
        }
      }
    },
    [ttsSettings, stop]
  );

  // Cleanup on unmount
  useEffect(() => {
      return () => {
          stop();
      };
  }, [stop]);

  return { speak, stop, isPlaying, isLoading };
}
