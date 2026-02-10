import { WorkflowGenerationPayload } from "app-types/workflow";

type WorkflowPromptTool = {
  id: string;
  type: "mcp-tool" | "app-tool";
  description?: string;
  serverId?: string;
  serverName?: string;
  parameterSchema?: unknown;
};

const nodeInterfaceDefinition = `
type OutputSchemaSourceKey = {
  nodeId: string;
  path: string[]; // keys that map to the source node's output schema
};

type WorkflowNode = {
  id: string;
  name: string;
  description?: string;
  kind: "input" | "llm" | "condition" | "note" | "tool" | "http" | "template" | "output";
  generatedByAI: true;
  position?: { x: number; y: number }; // optional; can be rough
  outputSchema: Record<string, unknown>; // JSON schema describing the node's outputs
  // Optional kind-specific fields:
  outputData?: { key: string; source?: OutputSchemaSourceKey }[]; // output node mapping
  messages?: { role: "system" | "assistant" | "user"; content: string }[]; // LLM prompts
  tool?: {
    type: "mcp-tool" | "app-tool";
    id: string; // toolId from the catalog below
    serverId?: string;
    serverName?: string;
  };
  model?: Record<string, unknown>;
  branches?: Record<string, unknown>; // condition branches
  url?: string | OutputSchemaSourceKey;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";
  headers?: { key: string; value?: string | OutputSchemaSourceKey }[];
  query?: { key: string; value?: string | OutputSchemaSourceKey }[];
  body?: string | OutputSchemaSourceKey;
  template?: { type: "tiptap"; tiptap: Record<string, unknown> };
};

type WorkflowEdge = {
  id?: string;
  source: string; // nodeId
  target: string; // nodeId
  sourceHandle?: "if" | "elseif" | "else" | "right";
  targetHandle?: string;
  label?: string;
};

type WorkflowCompilerResponse = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};
`.trim();

const compilerRules = `
- Always include an Input node as the first producer of data and an Output node that emits final results.
- Build coherent paths: create edges that respect data dependencies; avoid cycles.
- Enforce variable consistency using {{variable_name}} placeholders when referencing upstream data in LLM/template/HTTP bodies.
- Prefer MCP tools only from the provided catalog; reject anything not listed.
- Provide realistic outputSchema definitions that mirror the data each node produces.
- Connect nodes so that every non-input node has a reachable data source; every edge must reference an existing node id.
- Keep ids stable and descriptive (kebab-case is fine); the frontend will re-id if collisions occur.
- Mark every node with generatedByAI: true to indicate draft status for manual review.
- Use autopicker behavior: suggest the next logical node based on the output of the previous one (e.g., search -> summarize -> post).
- Polish prompts: ensure each LLM message is well-scoped, references inputs via {{var}} placeholders, and avoids ambiguity.
`.trim();

const formatTool = (tool: WorkflowPromptTool) => {
  const id = tool.serverName ? `${tool.serverName}:${tool.id}` : tool.id;
  return `- ${id} (${tool.type}${tool.serverName ? ` · serverId=${tool.serverId}` : ""}): ${tool.description || "no description"}
  schema: ${JSON.stringify(tool.parameterSchema || {}, null, 2)}`;
};

export function buildWorkflowCompilerPrompt(tools: WorkflowPromptTool[]) {
  const formattedTools =
    tools.length > 0
      ? tools.map(formatTool).join("\n")
      : "- No active tools; rely on LLM and HTTP nodes only.";

  return `
You are the Workflow Compiler. Convert a user goal into a React Flow graph describing nodes and edges that our workflow engine can run.

<type_definitions>
${nodeInterfaceDefinition}
</type_definitions>

<tool_catalog>
${formattedTools}
</tool_catalog>

<rules>
${compilerRules}
</rules>

Output strict JSON that matches WorkflowCompilerResponse with valid node ids and edge references. Do not include any prose outside of the JSON.
`.trim();
}

export type BuildWorkflowCompilerPromptInput = WorkflowGenerationPayload;
