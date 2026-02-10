import { streamObject } from "ai";
import { getSession } from "auth/server";
import { ChatModel } from "app-types/chat";
import { WorkflowGenerateSchema } from "app-types/workflow";
import { customModelProvider } from "lib/ai/models";
import { buildWorkflowGenerationPrompt } from "lib/ai/workflow-prompt";
import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";
import { loadAppDefaultTools } from "../../chat/shared.chat";
import { WorkflowToolKey } from "lib/ai/workflow/workflow.interface";
import globalLogger from "logger";
import { colorize } from "consola/utils";
import { safe } from "ts-safe";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Workflow Generate API: `),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();

    const { chatModel, message = "" } = json as {
      chatModel?: ChatModel;
      message: string;
    };

    if (!message.trim()) {
      return new Response("Message is required", { status: 400 });
    }

    logger.info(`chatModel: ${chatModel?.provider}/${chatModel?.model}`);

    const session = await getSession();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Collect available tools for the workflow
    const availableTools: WorkflowToolKey[] = [];

    // Add MCP tools
    await safe(mcpClientsManager.tools())
      .ifOk((tools) => {
        Object.values(tools).forEach((tool) => {
          availableTools.push({
            id: tool._originToolName,
            description: tool.description || "No description",
            type: "mcp-tool",
            serverId: tool._originToolName.split("__")[0] || "",
            serverName: tool._originToolName.split("__")[0] || "",
            parameterSchema: (tool.inputSchema as any)?.jsonSchema,
          });
        });
      })
      .unwrap();

    // Add default app tools
    await safe(loadAppDefaultTools)
      .ifOk((appTools) => {
        Object.entries(appTools).forEach(([toolName, tool]) => {
          availableTools.push({
            id: toolName,
            description: tool.description || "No description",
            type: "app-tool",
            parameterSchema: (tool.inputSchema as any)?.jsonSchema,
          });
        });
      })
      .unwrap();

    logger.info(`Available tools: ${availableTools.length}`);

    const system = buildWorkflowGenerationPrompt(availableTools);

    const result = streamObject({
      model: customModelProvider.getModel(chatModel),
      system,
      prompt: message,
      schema: WorkflowGenerateSchema,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    logger.error(error);
    return new Response("Internal server error", { status: 500 });
  }
}
