"use client";

import { useEffect, useState } from "react";
import { experimental_useObject } from "@ai-sdk/react";
import { ChatModel } from "app-types/chat";
import {
  WorkflowGenerationPayload,
  WorkflowGenerationSchema,
} from "app-types/workflow";
import { handleErrorWithToast } from "ui/shared-toast";
import { CommandIcon, CornerRightUpIcon, SparklesIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Button } from "ui/button";
import { Textarea } from "ui/textarea";
import { MessageLoading } from "ui/message-loading";
import { SelectModel } from "@/components/select-model";
import { appStore } from "@/app/store";

export function AIWorkflowModal({
  open,
  onOpenChange,
  onGenerated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (data: WorkflowGenerationPayload) => void;
}) {
  const [model, setModel] = useState<ChatModel | undefined>(
    appStore.getState().chatModel,
  );
  const [prompt, setPrompt] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState("");

  const { submit, isLoading, object } = experimental_useObject({
    api: "/api/workflow/generate",
    schema: WorkflowGenerationSchema,
    onFinish(event) {
      if (event.error) {
        handleErrorWithToast(event.error);
      }
      if (event.object) {
        onGenerated(event.object);
      }
      onOpenChange(false);
      setPrompt("");
      setSubmittedPrompt("");
      setModel(appStore.getState().chatModel);
    },
  });

  const handleSubmit = () => {
    setSubmittedPrompt(prompt);
    submit({
      message: prompt,
      chatModel: model,
    });
    setPrompt("");
  };

  useEffect(() => {
    if (object && isLoading) {
      onGenerated(object);
    }
  }, [object, isLoading, onGenerated]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:max-w-[40vw] w-full max-w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-purple-500" />
            Generate Workflow
          </DialogTitle>
          <DialogDescription className="sr-only">
            Generate a workflow draft from instructions
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 w-full">
          <div className="px-4">
            <p className="bg-secondary rounded-lg max-w-2/3 p-4 text-sm">
              Describe the automation you want. The AI will pick tools, connect
              nodes, and mark them as draft so you can review.
            </p>
          </div>

          <div className="flex justify-end px-4">
            <p className="text-sm bg-primary text-primary-foreground py-4 px-6 rounded-lg">
              {isLoading && submittedPrompt ? (
                submittedPrompt
              ) : (
                <MessageLoading className="size-4" />
              )}
            </p>
          </div>

          <div className="relative flex flex-col border rounded-lg p-4">
            <Textarea
              value={prompt}
              autoFocus
              placeholder="e.g. Scrape the latest AI news and post a 5-bullet summary to Slack."
              disabled={isLoading}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey && !isLoading) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="w-full break-all pb-6 border-none! ring-0! resize-none min-h-24 max-h-48 overflow-y-auto placeholder:text-xs transition-colors"
            />
            <div className="flex justify-end items-center gap-2">
              <SelectModel showProvider onSelect={(value) => setModel(value)} />
              <Button
                disabled={!prompt.trim() || isLoading}
                size="sm"
                onClick={handleSubmit}
                className="text-xs"
              >
                <span className="mr-1">
                  {isLoading ? "Generating..." : "Send"}
                </span>
                {isLoading ? (
                  <div className="size-3 border border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CommandIcon className="size-3" />
                    <CornerRightUpIcon className="size-3" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
