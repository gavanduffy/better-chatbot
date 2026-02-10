import dagre from "dagre";
import { useCallback } from "react";
import { Edge } from "@xyflow/react";
import { UINode } from "lib/ai/workflow/workflow.interface";

const NODE_WIDTH = 288;
const NODE_HEIGHT = 160;

export function useWorkflowLayout() {
  return useCallback((nodes: UINode[], edges: Edge[]) => {
    const graph = new dagre.graphlib.Graph();
    graph.setGraph({
      rankdir: "LR",
      nodesep: 80,
      ranksep: 140,
    });
    graph.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((node) => {
      graph.setNode(node.id, {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    });

    edges.forEach((edge) => {
      graph.setEdge(edge.source, edge.target);
    });

    dagre.layout(graph);

    return nodes.map((node) => {
      const position = graph.node(node.id);
      if (!position) return node;

      return {
        ...node,
        position: {
          x: position.x,
          y: position.y,
        },
      };
    });
  }, []);
}
