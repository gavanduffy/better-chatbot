import { Tool } from "ai";
import { ObjectJsonSchema7, Visibility } from "./util";
import { NodeKind } from "lib/ai/workflow/workflow.interface";
import { tag } from "lib/tag";
import { z } from "zod";

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
  nodeConfig: Record<string, any>;
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

/**
 * Schema for AI-generated workflow node configuration
 */
const WorkflowNodeConfigSchema = z.record(z.string(), z.any());

/**
 * Schema for AI-generated workflow node
 */
export const WorkflowGenerateNodeSchema = z.object({
  id: z.string().describe("Unique node identifier"),
  name: z.string().describe("Node name"),
  description: z.string().optional().describe("Node description"),
  kind: z
    .enum(["input", "llm", "tool", "http", "template", "condition", "output"])
    .describe("Node type"),
  config: WorkflowNodeConfigSchema.describe("Node-specific configuration"),
});

/**
 * Schema for AI-generated workflow edge
 */
export const WorkflowGenerateEdgeSchema = z.object({
  id: z.string().describe("Unique edge identifier"),
  source: z.string().describe("Source node ID"),
  target: z.string().describe("Target node ID"),
  sourceHandle: z.string().optional().describe("Source handle for conditions"),
  targetHandle: z.string().optional().describe("Target handle"),
});

/**
 * Schema for complete AI-generated workflow
 */
export const WorkflowGenerateSchema = z.object({
  name: z.string().describe("Workflow name"),
  description: z.string().optional().describe("Workflow description"),
  nodes: z.array(WorkflowGenerateNodeSchema).describe("Workflow nodes"),
  edges: z.array(WorkflowGenerateEdgeSchema).describe("Workflow edges"),
});

export type WorkflowGenerate = z.infer<typeof WorkflowGenerateSchema>;
