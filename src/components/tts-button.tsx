"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { cn } from "lib/utils";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface TTSButtonProps {
  text: string;
  className?: string;
}

type TTSState = "idle" | "loading" | "playing" | "error";

export function TTSButton({ text, className }: TTSButtonProps) {
  const t = useTranslations();
  const [state, setState] = useState<TTSState>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup audio URL and abort controller on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  const handleAudioEnded = useCallback(() => {
    setState("idle");
  }, []);

  const handleAudioError = useCallback(() => {
    setState("error");
    toast.error(t("Chat.ttsError") || "Failed to play audio");
  }, [t]);

  const generateAndPlay = useCallback(async () => {
    // If already playing, stop
    if (state === "playing" && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState("idle");
      return;
    }

    // If we already have the audio cached, just play it
    if (audioUrl && audioRef.current) {
      try {
        await audioRef.current.play();
        setState("playing");
        return;
      } catch {
        // Fall through to regenerate
      }
    }

    setState("loading");

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
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(error.error || "Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Create and play audio
      const audio = new Audio(url);
      audio.addEventListener("ended", handleAudioEnded);
      audio.addEventListener("error", handleAudioError);
      audioRef.current = audio;

      await audio.play();
      setState("playing");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("TTS error:", error);
      setState("error");
      toast.error(
        error instanceof Error ? error.message : t("Chat.ttsError") || "Failed to generate speech"
      );
    }
  }, [text, state, audioUrl, t, handleAudioEnded, handleAudioError]);

  const getIcon = () => {
    switch (state) {
      case "loading":
        return <Loader2 className="size-3.5 animate-spin" />;
      case "playing":
        return <VolumeX className="size-3.5" />;
      case "error":
        return <VolumeX className="size-3.5 text-destructive" />;
      default:
        return <Volume2 className="size-3.5" />;
    }
  };

  const getTooltipText = () => {
    switch (state) {
      case "loading":
        return t("Chat.generatingSpeech") || "Generating speech...";
      case "playing":
        return t("Chat.stopSpeaking") || "Stop speaking";
      case "error":
        return t("Chat.speechError") || "Speech error";
      default:
        return t("Chat.speakMessage") || "Speak message";
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={generateAndPlay}
          disabled={state === "loading"}
          className={cn(
            "size-3! p-4! transition-all duration-200",
            state === "playing" && "text-primary bg-primary/10",
            state === "error" && "text-destructive",
            className
          )}
          aria-label={getTooltipText()}
        >
          {getIcon()}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{getTooltipText()}</TooltipContent>
    </Tooltip>
  );
}
