"use client";

import { ToolUIPart, getToolName } from "ai";
import { useCanvasStore } from "@/app/store/canvas.store";
import { useEffect, useMemo } from "react";
import { Button } from "ui/button";
import { ExternalLink, Loader2 } from "lucide-react";

export function CanvasToolPart({ part }: { part: ToolUIPart }) {
  const { openCanvas } = useCanvasStore();
  const toolName = useMemo(() => getToolName(part), [part]);

  const getArgs = (part: ToolUIPart) => {
      // @ts-ignore
      return part.args || part.input;
  };

  useEffect(() => {
    const args = getArgs(part);
    if (args) {
       // Only open if we have content
       if (args.title && (args.content || args.slides)) {
           // @ts-ignore
           if (part.state === 'result' || part.state === 'call' || part.state?.startsWith('output')) {
               openCanvas({
                   title: args.title,
                   type: toolName === "createPresentation" ? "presentation" : args.type,
                   content: toolName === "createPresentation" ? args.slides : args.content,
               });
           }
       }
    }
  }, [part, openCanvas, toolName]);

  // @ts-ignore
  const isGenerating = !part.state?.startsWith('output') && part.state !== 'result';

  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 w-fit text-sm">
        {isGenerating && <Loader2 className="h-3 w-3 animate-spin" />}
        <span>
            {toolName === "createPresentation" ? "Generating Presentation..." : "Generating Canvas..."}
        </span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => {
             const args = getArgs(part);
             if (args) {
                 openCanvas({
                    title: args.title || "Untitled",
                    type: toolName === "createPresentation" ? "presentation" : args.type || "html",
                    content: toolName === "createPresentation" ? args.slides : args.content || "",
                 });
             }
        }}>
            <ExternalLink className="h-3 w-3 mr-1" />
            Open
        </Button>
    </div>
  );
}
