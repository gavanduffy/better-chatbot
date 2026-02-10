"use client";

import { useState } from "react";
import { experimental_useObject } from "@ai-sdk/react";
import { ChatModel } from "app-types/chat";
import { WorkflowGenerateSchema } from "app-types/workflow";
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

interface AIWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkflowGenerated: (data: any) => void;
}

export function AIWorkflowModal({
  open,
  onOpenChange,
  onWorkflowGenerated,
}: AIWorkflowModalProps) {
  const [generateModel, setGenerateModel] = useState<ChatModel | undefined>(
    appStore.getState().chatModel,
  );
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState("");

  const { submit, isLoading } = experimental_useObject({
    api: "/api/workflow/generate",
    schema: WorkflowGenerateSchema,
    onFinish(event) {
      if (event.error) {
        handleErrorWithToast(event.error);
      }
      if (event.object) {
        onWorkflowGenerated(event.object);
      }
      // Close dialog after generation completes
      onOpenChange(false);
      setGeneratePrompt("");
      setSubmittedPrompt("");
      // Reset to current global default model
      setGenerateModel(appStore.getState().chatModel);
    },
  });

  const submitGenerate = () => {
    setSubmittedPrompt(generatePrompt);
    submit({
      message: generatePrompt,
      chatModel: generateModel,
    });
    setGeneratePrompt(""); // Clear textarea immediately after submit
    // Don't close dialog immediately - will close in onFinish
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:max-w-[40vw] w-full max-w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-5 text-primary" />
            Generate Workflow
          </DialogTitle>
          <DialogDescription className="sr-only">
            Generate Workflow with AI
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 w-full">
          <div className="px-4">
            <p className="bg-secondary rounded-lg max-w-2/3 p-4">
              Describe what you want your workflow to do, and AI will generate
              the nodes and connections for you. For example: "Scrape the latest
              news on AI and post it to Slack" or "Search for a topic and
              summarize the results".
            </p>
          </div>

          <div className="flex justify-end px-4">
            <p className="text-sm bg-primary text-primary-foreground py-4 px-6 rounded-lg">
              {isLoading && submittedPrompt ? (
                <MessageLoading className="size-4" />
              ) : (
                submittedPrompt || <MessageLoading className="size-4" />
              )}
            </p>
          </div>

          <div className="relative flex flex-col border rounded-lg p-4">
            <Textarea
              value={generatePrompt}
              autoFocus
              placeholder="Describe your workflow goal here..."
              disabled={isLoading}
              onChange={(e) => setGeneratePrompt(e.target.value)}
              data-testid="workflow-generate-prompt-textarea"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey && !isLoading) {
                  e.preventDefault();
                  submitGenerate();
                }
              }}
              className="w-full break-all pb-6 border-none! ring-0! resize-none min-h-24 max-h-48 overflow-y-auto placeholder:text-xs transition-colors"
            />
            <div className="flex justify-end items-center gap-2">
              <SelectModel
                showProvider
                onSelect={(model) => setGenerateModel(model)}
              />
              <Button
                disabled={!generatePrompt.trim() || isLoading}
                size="sm"
                data-testid="workflow-generate-prompt-submit-button"
                onClick={submitGenerate}
                className="text-xs"
              >
                <span className="mr-1">
                  {isLoading ? "Generating..." : "Generate"}
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
