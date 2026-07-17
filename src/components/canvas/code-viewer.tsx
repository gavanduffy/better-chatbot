"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { Copy, Check } from "lucide-react";
import { Button } from "ui/button";
import { toast } from "sonner";
import { cn } from "lib/utils";

interface CodeViewerProps {
  code: string;
  language: string;
  className?: string;
}

export function CodeViewer({ code, language, className }: CodeViewerProps) {
  const [html, setHtml] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function highlight() {
      try {
        const out = await codeToHtml(code, {
          lang: language,
          theme: "github-dark",
        });
        if (mounted) setHtml(out);
      } catch (e) {
        console.error("Shiki error:", e);
        if (mounted) setHtml(`<pre class="p-4 overflow-x-auto text-sm font-mono text-foreground">${code}</pre>`);
      }
    }
    highlight();
    return () => { mounted = false; };
  }, [code, language]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("relative group rounded-md border bg-muted/50 overflow-hidden", className)}>
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={copyToClipboard} className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <div
        className="overflow-x-auto text-sm [&>pre]:p-4 [&>pre]:bg-transparent! [&>pre]:m-0"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
