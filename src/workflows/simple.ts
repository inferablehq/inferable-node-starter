import { Inferable } from "inferable";
import { z } from "zod";

const inferable = new Inferable({
  apiSecret: "PASTE_YOUR_API_KEY_HERE",
});

const workflow = inferable.workflows.create({
  name: "simple",
  inputSchema: z.object({
    executionId: z.string(),
    url: z.string(),
  }),
});

workflow.version(1).define(async (ctx, input) => {
  // Write your workflow here. For example, see https://docs.inferable.ai/pages/quick-start
});

// This will register the workflow with the Inferable control-plane at api.inferable.ai
workflow.listen().then(() => {
  console.log("Workflow listening");
});
