import { z } from "zod";
import { tool } from "ai";

export const createPresentationTool = tool({
  description: "Create a presentation with slides. Each slide has a title and HTML content.",
  parameters: z.object({
    title: z.string().describe("The title of the presentation"),
    slides: z.array(z.object({
      title: z.string().describe("The title of the slide"),
      content: z.string().describe("The HTML content of the slide body"),
      type: z.enum(["title", "content", "two-column"]).optional().describe("The layout type of the slide"),
    })).describe("The array of slides"),
  }),
  execute: async ({ title, slides }) => {
    return { title, slides };
  },
});
