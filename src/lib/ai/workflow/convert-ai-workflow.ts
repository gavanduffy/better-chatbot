import { Edge } from "@xyflow/react";
import { WorkflowGenerate } from "app-types/workflow";
import { generateUUID } from "lib/utils";
import { UINode, NodeKind } from "./workflow.interface";
import { createUINode } from "./create-ui-node";
import { arrangeNodes } from "./arrange-nodes";

/**
 * Convert AI-generated workflow structure to UI nodes and edges.
 * Assigns unique IDs, validates structure, and applies auto-layout.
 */
export function convertAIWorkflowToUI(
  aiWorkflow: WorkflowGenerate,
  existingNodeIds: string[] = [],
): {
  nodes: UINode[];
  edges: Edge[];
  metadata: {
    name: string;
    description?: string;
  };
} {
  // Create ID mapping to prevent collisions
  const idMap = new Map<string, string>();
  const existingIdsSet = new Set(existingNodeIds);

  // Generate unique IDs for all nodes
  aiWorkflow.nodes.forEach((node) => {
    let newId = node.id;
    while (existingIdsSet.has(newId)) {
      newId = `${node.id}_${generateUUID().slice(0, 8)}`;
    }
    idMap.set(node.id, newId);
    existingIdsSet.add(newId);
  });

  // Convert nodes
  const nodes: UINode[] = aiWorkflow.nodes.map((aiNode) => {
    const newId = idMap.get(aiNode.id) || aiNode.id;
    const kind = aiNode.kind as NodeKind;

    // Create base node using existing utility
    const uiNode = createUINode(kind, {
      id: newId,
      name: aiNode.name,
      position: { x: 0, y: 0 }, // Will be set by arrangeNodes
    });

    // Mark as AI-generated
    if (uiNode.data.runtime) {
      uiNode.data.runtime.generatedByAI = true;
      uiNode.data.runtime.isNew = false;
    }

    // Set description if provided
    if (aiNode.description) {
      uiNode.data.description = aiNode.description;
    }

    // Apply node-specific config from AI
    if (aiNode.config) {
      // Handle outputSchema
      if (aiNode.config.outputSchema) {
        uiNode.data.outputSchema = aiNode.config.outputSchema;
      }

      // Handle LLM node
      if (kind === NodeKind.LLM && aiNode.config.messages) {
        const llmNode = uiNode as UINode<NodeKind.LLM>;
        llmNode.data.messages = aiNode.config.messages.map((msg: any) => ({
          role: msg.role || "user",
          content:
            typeof msg.content === "string"
              ? {
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: msg.content }],
                    },
                  ],
                }
              : msg.content,
        }));
      }

      // Handle Tool node
      if (kind === NodeKind.Tool) {
        const toolNode = uiNode as UINode<NodeKind.Tool>;
        if (aiNode.config.toolId) {
          toolNode.data.tool = {
            id: aiNode.config.toolId,
            description: aiNode.config.toolDescription || "",
            type: "mcp-tool",
            serverId: aiNode.config.serverId || aiNode.config.toolId,
            serverName: aiNode.config.serverName || aiNode.config.toolId,
          };
        }
        if (aiNode.config.message) {
          toolNode.data.message = {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: aiNode.config.message }],
              },
            ],
          };
        }
      }

      // Handle HTTP node
      if (kind === NodeKind.Http) {
        const httpNode = uiNode as UINode<NodeKind.Http>;
        if (aiNode.config.url) {
          httpNode.data.url = aiNode.config.url;
        }
        if (aiNode.config.method) {
          httpNode.data.method = aiNode.config.method;
        }
        if (aiNode.config.headers) {
          httpNode.data.headers = aiNode.config.headers;
        }
        if (aiNode.config.query) {
          httpNode.data.query = aiNode.config.query;
        }
        if (aiNode.config.body) {
          httpNode.data.body = aiNode.config.body;
        }
      }

      // Handle Template node
      if (kind === NodeKind.Template && aiNode.config.template) {
        const templateNode = uiNode as UINode<NodeKind.Template>;
        const templateContent =
          typeof aiNode.config.template === "string"
            ? {
                type: "doc",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: aiNode.config.template }],
                  },
                ],
              }
            : aiNode.config.template;

        templateNode.data.template = {
          type: "tiptap",
          tiptap: templateContent,
        };
      }

      // Handle Output node
      if (kind === NodeKind.Output && aiNode.config.outputData) {
        const outputNode = uiNode as UINode<NodeKind.Output>;
        outputNode.data.outputData = aiNode.config.outputData.map(
          (output: any) => ({
            key: output.key,
            source: output.sourceNodeId
              ? {
                  nodeId: idMap.get(output.sourceNodeId) || output.sourceNodeId,
                  path: output.sourcePath || [],
                }
              : undefined,
          }),
        );
      }
    }

    return uiNode;
  });

  // Convert edges with remapped IDs
  const edges: Edge[] = aiWorkflow.edges.map((aiEdge) => ({
    id: `${idMap.get(aiEdge.source) || aiEdge.source}-${idMap.get(aiEdge.target) || aiEdge.target}`,
    source: idMap.get(aiEdge.source) || aiEdge.source,
    target: idMap.get(aiEdge.target) || aiEdge.target,
    sourceHandle: aiEdge.sourceHandle,
    targetHandle: aiEdge.targetHandle,
  }));

  // Apply auto-layout to position nodes
  const { nodes: arrangedNodes } = arrangeNodes(nodes, edges);

  return {
    nodes: arrangedNodes,
    edges,
    metadata: {
      name: aiWorkflow.name,
      description: aiWorkflow.description,
    },
  };
}
