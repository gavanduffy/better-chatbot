import { tool as createTool } from "ai";
import { z } from "zod";

export const createSlidesTool = createTool({
  description: "Generate a slide deck (presentation). Use this when the user asks to create slides or a presentation. The output MUST be a JSON object with a 'title' and 'slides' array. Each slide has 'title', 'content', and optional 'type' ('title', 'content', 'two-column'). Do NOT output HTML for the slides content itself unless explicitly requested inside the content string, but the outer structure must be JSON.",
  inputSchema: z.object({
    title: z.string().describe("The title of the presentation"),
    slides: z.array(
      z.object({
        title: z.string().describe("The title of the slide"),
        content: z.string().describe("The content of the slide"),
        type: z.enum(["title", "content", "two-column"]).optional().describe("The layout type of the slide"),
      })
    ).describe("The array of slides"),
  }),
  execute: async () => {
    return "Success";
  },
});
