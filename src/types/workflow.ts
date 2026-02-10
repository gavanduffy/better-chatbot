import { Tool } from "ai";
import { ObjectJsonSchema7, Visibility } from "./util";
import { z } from "zod";
import { NodeKind } from "lib/ai/workflow/workflow.interface";
import { tag } from "lib/tag";

export type WorkflowIcon = {
  type: "emoji";
  value: string;
  style?: Record<string, string>;
};

export type DBWorkflow = {
  id: string;
  icon?: WorkflowIcon;
  readonly version: string;
  name: string;
  description?: string;
  isPublished: boolean;
  visibility: Visibility;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DBNode = {
  id: string;
  workflowId: string;
  kind: string;
  name: string;
  description?: string;
  nodeConfig: Record<string, any> & {
    generatedByAI?: boolean;
  };
  uiConfig: {
    position?: {
      x: number;
      y: number;
    };
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
};
export type DBEdge = {
  id: string;
  workflowId: string;
  source: string;
  target: string;
  uiConfig: {
    sourceHandle?: string;
    targetHandle?: string;
    [key: string]: any;
  };
  createdAt: Date;
};

export type WorkflowSummary = {
  id: string;
  name: string;
  description?: string;
  icon?: WorkflowIcon;
  visibility: Visibility;
  isPublished: boolean;
  userId: string;
  userName: string;
  userAvatar?: string;
  updatedAt: Date;
};
export interface WorkflowRepository {
  delete(id: string): Promise<void>;
  selectByUserId(userId: string): Promise<DBWorkflow[]>;
  selectAll(userId: string): Promise<WorkflowSummary[]>;
  selectExecuteAbility(userId: string): Promise<WorkflowSummary[]>;
  selectToolByIds(ids: string[]): Promise<
    {
      id: string;
      name: string;
      description?: string;
      schema: ObjectJsonSchema7;
    }[]
  >;
  checkAccess(
    workflowId: string,
    userId: string,
    readOnly?: boolean,
  ): Promise<boolean>;
  selectById(id: string): Promise<DBWorkflow | null>;
  save(
    workflow: PartialBy<
      DBWorkflow,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "visibility"
      | "isPublished"
      | "version"
    >,
    noGenerateInputNode?: boolean,
  ): Promise<DBWorkflow>;
  saveStructure(data: {
    workflowId: string;
    nodes?: DBNode[];
    edges?: DBEdge[];
    deleteNodes?: string[]; // node id
    deleteEdges?: string[]; // edge id
  }): Promise<void>;

  selectStructureById(
    id: string,
    option?: {
      ignoreNote?: boolean;
    },
  ): Promise<
    | null
    | (DBWorkflow & {
        nodes: DBNode[];
        edges: DBEdge[];
      })
  >;
}

export type VercelAIWorkflowTool = Tool & {
  _workflowId: string;
  _toolName: string;
  _originToolName: string;
};

export const VercelAIWorkflowToolTag = tag<VercelAIWorkflowTool>("workflow");

export type VercelAIWorkflowToolStreaming = {
  name: string;
  startedAt: number;
  kind: NodeKind;
  endedAt?: number;
  id: string;
  status: "running" | "success" | "fail";
  error?: { name: string; message: string };
  result?: { input?: any; output?: any };
};

export type VercelAIWorkflowToolStreamingResult = {
  toolCallId: string;
  workflowName: string;
  workflowIcon?: WorkflowIcon;

  startedAt: number;
  endedAt: number;
  history: VercelAIWorkflowToolStreaming[];
  error?: { name: string; message: string };
  result?: any;
  status: "running" | "success" | "fail";
};

export const VercelAIWorkflowToolStreamingResultTag =
  tag<VercelAIWorkflowToolStreamingResult>("workflow-streaming-result");

const outputSchemaSourceKeySchema = z.object({
  nodeId: z.string().min(1),
  path: z.array(z.string()).default([]),
});

export const WorkflowGenerationNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  kind: z.nativeEnum(NodeKind),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .partial()
    .optional(),
  outputSchema: z.record(z.any()).optional(),
  outputData: z
    .array(
      z.object({
        key: z.string().min(1),
        source: outputSchemaSourceKeySchema.optional(),
      }),
    )
    .optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1),
      }),
    )
    .optional(),
  model: z.any().optional(),
  tool: z
    .object({
      type: z.enum(["mcp-tool", "app-tool"]).optional(),
      id: z.string().min(1),
      serverId: z.string().optional(),
      serverName: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  branches: z.any().optional(),
  url: z.union([z.string(), outputSchemaSourceKeySchema]).optional(),
  method: z.string().optional(),
  headers: z
    .array(
      z.object({
        key: z.string(),
        value: z.union([z.string(), outputSchemaSourceKeySchema]).optional(),
      }),
    )
    .optional(),
  query: z
    .array(
      z.object({
        key: z.string(),
        value: z.union([z.string(), outputSchemaSourceKeySchema]).optional(),
      }),
    )
    .optional(),
  body: z.union([z.string(), outputSchemaSourceKeySchema]).optional(),
  template: z.any().optional(),
  generatedByAI: z.boolean().optional(),
});

export const WorkflowGenerationEdgeSchema = z.object({
  id: z.string().optional(),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  label: z.string().optional(),
});

export const WorkflowGenerationSchema = z
  .object({
    nodes: z.array(WorkflowGenerationNodeSchema),
    edges: z.array(WorkflowGenerationEdgeSchema),
  })
  .superRefine((value, ctx) => {
    const nodeIds = new Set(value.nodes.map((node) => node.id));
    value.edges.forEach((edge, idx) => {
      if (!nodeIds.has(edge.source)) {
        ctx.addIssue({
          code: "custom",
          path: ["edges", idx, "source"],
          message: `Source node "${edge.source}" is missing from nodes.`,
        });
      }
      if (!nodeIds.has(edge.target)) {
        ctx.addIssue({
          code: "custom",
          path: ["edges", idx, "target"],
          message: `Target node "${edge.target}" is missing from nodes.`,
        });
      }
    });
  });

export type WorkflowGenerationNode = z.infer<
  typeof WorkflowGenerationNodeSchema
>;
export type WorkflowGenerationEdge = z.infer<
  typeof WorkflowGenerationEdgeSchema
>;
export type WorkflowGenerationPayload = z.infer<
  typeof WorkflowGenerationSchema
>;
