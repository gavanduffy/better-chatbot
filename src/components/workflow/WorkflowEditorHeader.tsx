"use client";

import { SparklesIcon } from "lucide-react";
import { Button } from "ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

export function WorkflowEditorHeader({
  onOpenAIWorkflow,
  disabled,
}: {
  onOpenAIWorkflow: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="secondary"
            onClick={onOpenAIWorkflow}
            disabled={disabled}
            className="rounded-full border-dashed"
          >
            <SparklesIcon className="size-4 text-purple-600" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="text-sm">
          <p>Magic: generate a workflow from a goal</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
