import { describe, expect, it, beforeEach } from "vitest";

import { useWorkflowStore } from "./workflow.store";
import { createUINode } from "lib/ai/workflow/create-ui-node";
import { NodeKind } from "lib/ai/workflow/workflow.interface";

describe("useWorkflowStore.setGeneratedWorkflow", () => {
  beforeEach(() => {
    useWorkflowStore.setState((state) => ({
      ...state,
      generatedWorkflow: undefined,
      processIds: [],
    }));
  });

  it("deduplicates node ids and marks generated drafts", () => {
    const existingNode = createUINode(NodeKind.Input, { id: "input" });

    const result = useWorkflowStore.getState().setGeneratedWorkflow({
      generatedNodes: [
        {
          id: "input",
          name: "AI Input",
          kind: NodeKind.Input,
          outputSchema: {},
        },
        {
          id: "llm",
          name: "Summarize",
          kind: NodeKind.LLM,
          messages: [{ role: "user", content: "Summarize {{input.result}}" }],
        },
      ],
      generatedEdges: [{ source: "input", target: "llm" }],
      existingNodes: [existingNode],
      existingEdges: [],
    });

    expect(result.nodes).toHaveLength(2);
    expect(new Set(result.nodes.map((node) => node.id)).size).toBe(2);
    expect(result.nodes.every((node) => node.data.generatedByAI)).toBe(true);

    const edge = result.edges[0]!;
    expect(edge.source).not.toBe(edge.target);
    expect(result.nodes.find((node) => node.id === edge.source)).toBeTruthy();
    expect(result.nodes.find((node) => node.id === edge.target)).toBeTruthy();
  });
});
