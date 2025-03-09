import { Inferable } from "inferable";
import { z } from "zod";

if (!process.env.INFERABLE_API_SECRET) {
  throw new Error("INFERABLE_API_SECRET is not set");
}

const inferable = new Inferable({
  apiSecret: process.env.INFERABLE_API_SECRET,
});

const workflow = inferable.workflows.create({
  name: "hello",
  inputSchema: z.object({
    executionId: z.string(),
  }),
});

workflow.version(1).define(async (ctx, input) => {
  const hnFrontPageText = await ctx.memo("hnFrontPage", async () => {
    const response = await fetch("https://news.ycombinator.com");
    const html = await response.text();

    return html;
  });

  const topHNPosts = await ctx.llm.structured({
    input: hnFrontPageText,
    schema: z.object({
      posts: z.array(
        z.object({
          title: z.string(),
          url: z.string(),
          points: z.number(),
          comments: z.number(),
        })
      ),
    }),
  });

  const [mostPopularPost] = topHNPosts.posts.sort(
    (a, b) => b.points - a.points
  );

  if (!process.env.INFERABLE_NOTIFICATION_EMAIL) {
    throw new Error("INFERABLE_NOTIFICATION_EMAIL is not set");
  }

  await ctx.notify({
    message: `The most popular posts on Hacker News is ${mostPopularPost.title} with ${mostPopularPost.points} points and ${mostPopularPost.comments} comments`,
    destination: {
      type: "email",
      email: process.env.INFERABLE_NOTIFICATION_EMAIL,
    },
  });

  return mostPopularPost;
});

// This will register the workflow with the Inferable control-plane at api.inferable.ai
workflow.listen().then(() => {
  console.log("Workflow listening");
});
