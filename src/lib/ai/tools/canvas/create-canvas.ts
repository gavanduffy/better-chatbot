import { tool as createTool } from "ai";
import { z } from "zod";

export const createCanvasTool = createTool({
  description: "Create or update content in the canvas. Use this when the user asks to visualize something, create a dashboard, write an article, or design a UI component.",
  inputSchema: z.object({
    title: z.string().describe("The title of the canvas artifact"),
    type: z.enum(["html", "react"]).describe("The type of content to render"),
    content: z.string().describe("The content to render (HTML or React component code). For React, provide the full component code including imports if necessary, but standard React hooks are available globally or implicitly."),
  }),
  execute: async () => {
    return "Success";
  },
});
