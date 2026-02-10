import { streamObject } from "ai";
import { z } from "zod";

import { getSession } from "auth/server";
import { ChatModel } from "app-types/chat";
import {
  WorkflowGenerationPayload,
  WorkflowGenerationSchema,
} from "app-types/workflow";
import { customModelProvider } from "lib/ai/models";
import { buildWorkflowCompilerPrompt } from "lib/ai/workflow-prompt";
import { initMCPManager, mcpClientsManager } from "lib/ai/mcp/mcp-manager";
import { DefaultToolName } from "lib/ai/tools";
import {
  exaContentsSchema,
  exaContentsTool,
  exaSearchSchema,
  exaSearchTool,
} from "lib/ai/tools/web/web-search";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { message, chatModel } = z
      .object({
        message: z.string().min(1),
        chatModel: z
          .object({
            provider: z.string(),
            model: z.string(),
          })
          .optional(),
      })
      .parse(json) as { message: string; chatModel?: ChatModel };

    const session = await getSession();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    await initMCPManager();
    const mcpTools = await mcpClientsManager.tools();
    const availableTools = Object.values(mcpTools).map((tool) => ({
      id: tool._originToolName,
      type: "mcp-tool" as const,
      serverId: tool._mcpServerId,
      serverName: tool._mcpServerName,
      description: tool.description,
      parameterSchema: tool.parameters,
    }));

    const defaultTools = [
      {
        id: DefaultToolName.WebSearch,
        type: "app-tool" as const,
        description: exaSearchTool.description,
        parameterSchema: exaSearchSchema,
      },
      {
        id: DefaultToolName.WebContent,
        type: "app-tool" as const,
        description: exaContentsTool.description,
        parameterSchema: exaContentsSchema,
      },
    ];

    const system = buildWorkflowCompilerPrompt([
      ...availableTools,
      ...defaultTools,
    ]);

    const result = streamObject<WorkflowGenerationPayload>({
      model: customModelProvider.getModel(chatModel),
      system,
      prompt: message,
      schema: WorkflowGenerationSchema,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Failed to generate workflow:", error);
    return new Response("Failed to generate workflow", { status: 500 });
  }
}
