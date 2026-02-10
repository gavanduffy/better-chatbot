"use client";
import { Edge } from "@xyflow/react";
import {
  DBWorkflow,
  WorkflowGenerationEdge,
  WorkflowGenerationNode,
} from "app-types/workflow";
import { createUINode } from "lib/ai/workflow/create-ui-node";
import { defaultObjectJsonSchema } from "lib/ai/workflow/shared.workflow";
import {
  NodeKind,
  OutputSchemaSourceKey,
  UINode,
} from "lib/ai/workflow/workflow.interface";
import { generateUUID, isObject } from "lib/utils";
import { create } from "zustand";

export interface WorkflowState {
  workflow?: DBWorkflow;
  processIds: string[];
  hasEditAccess?: boolean;
  generatedWorkflow?: {
    nodes: UINode[];
    edges: Edge[];
  };
}

export interface WorkflowDispatch {
  init: (workflow?: DBWorkflow, hasEditAccess?: boolean) => void;
  addProcess: () => () => void;
  setGeneratedWorkflow: (payload: {
    generatedNodes: WorkflowGenerationNode[];
    generatedEdges: WorkflowGenerationEdge[];
    existingNodes?: UINode[];
    existingEdges?: Edge[];
  }) => {
    nodes: UINode[];
    edges: Edge[];
  };
}

const initialState: WorkflowState = {
  processIds: [],
};

export const useWorkflowStore = create<WorkflowState & WorkflowDispatch>(
  (set) => ({
    ...initialState,
    init: (workflow, hasEditAccess) =>
      set({ ...initialState, workflow, hasEditAccess }),
    addProcess: () => {
      const processId = generateUUID();
      set((state) => ({
        processIds: [...state.processIds, processId],
      }));
      return () => {
        set((state) => ({
          processIds: state.processIds.filter((id) => id !== processId),
        }));
      };
    },
    setGeneratedWorkflow: ({
      generatedNodes,
      generatedEdges,
      existingNodes = [],
      existingEdges = [],
    }) => {
      const existingNodeIds = new Set(existingNodes.map((node) => node.id));
      const existingEdgeIds = new Set(existingEdges.map((edge) => edge.id));
      const remapId = new Map<string, string>();

      const remapSourceKey = (
        value?: unknown,
      ): OutputSchemaSourceKey | string | undefined => {
        if (!value || typeof value !== "object")
          return value as string | undefined;
        const maybeKey = value as Partial<OutputSchemaSourceKey>;
        if (!maybeKey.nodeId) return value as string | undefined;
        return {
          ...maybeKey,
          nodeId: remapId.get(maybeKey.nodeId) || maybeKey.nodeId,
        } as OutputSchemaSourceKey;
      };

      const toTipTap = (text?: string) => {
        if (!text) return undefined;
        return {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text,
                },
              ],
            },
          ],
        };
      };

      const nodes: UINode[] = generatedNodes.map((node) => {
        let finalId = node.id;
        while (existingNodeIds.has(finalId) || remapId.has(finalId)) {
          const nextId = generateUUID();
          remapId.set(node.id, nextId);
          finalId = nextId;
        }
        existingNodeIds.add(finalId);

        const uiNode = createUINode(node.kind as NodeKind, {
          id: finalId,
          name: node.name,
          position: node.position,
        });

        const baseData = uiNode.data as any;
        const mergedData = {
          ...baseData,
          ...node,
          id: finalId,
          name: node.name,
          description: node.description ?? baseData.description,
          outputSchema:
            (node.outputSchema as any) ??
            structuredClone(defaultObjectJsonSchema),
          outputData: node.outputData ?? baseData.outputData,
          messages: node.messages
            ? node.messages.map((message) => ({
                role: message.role,
                content: toTipTap(message.content),
              }))
            : baseData.messages,
          url: remapSourceKey(node.url),
          headers: node.headers?.map((header) => ({
            ...header,
            value: remapSourceKey(header.value),
          })),
          query: node.query?.map((query) => ({
            ...query,
            value: remapSourceKey(query.value),
          })),
          body: remapSourceKey(node.body),
          generatedByAI: true,
          runtime: {
            ...(baseData.runtime || {}),
            isNew: true,
          },
        };

        if (node.tool) {
          mergedData.tool = {
            ...node.tool,
          };
        }

        if (node.template && isObject(node.template)) {
          mergedData.template = node.template;
        }

        return {
          ...uiNode,
          id: finalId,
          data: mergedData,
          position: node.position ?? uiNode.position,
        };
      });

      const remapNodeId = (id: string) => remapId.get(id) || id;

      const edges: Edge[] = generatedEdges
        .map((edge) => {
          const source = remapNodeId(edge.source);
          const target = remapNodeId(edge.target);
          if (
            !nodes.find((node) => node.id === source) ||
            !nodes.find((node) => node.id === target)
          ) {
            return undefined;
          }
          let edgeId = edge.id || generateUUID();
          if (existingEdgeIds.has(edgeId)) {
            edgeId = generateUUID();
          }
          return {
            ...edge,
            id: edgeId,
            source,
            target,
          } as Edge;
        })
        .filter(Boolean) as Edge[];

      const sanitizedOutputData = nodes.map((node) => {
        if (!("outputData" in node.data) || !node.data.outputData) return node;
        return {
          ...node,
          data: {
            ...node.data,
            outputData: (node.data as any).outputData.map((output: any) => ({
              ...output,
              source: remapSourceKey(output.source),
            })),
          },
        };
      });

      const result = { nodes: sanitizedOutputData, edges };
      set({ generatedWorkflow: result });
      return result;
    },
  }),
);
