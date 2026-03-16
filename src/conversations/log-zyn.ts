import { type Conversation, type ConversationFlavor } from "@grammyjs/conversations";
import { Context } from "grammy";
import { updateZynLog } from "../services/notion";

type MyContext = ConversationFlavor<Context & { session: { pendingZynPageId?: string } }>;
type MyConversation = Conversation<MyContext, MyContext>;

export async function logZynConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const pageId = ctx.session.pendingZynPageId;
  if (!pageId) {
    await ctx.reply("Something went wrong — no Zyn entry to update.");
    return;
  }

  await ctx.reply("Rate your mental health right now (1-10):");

  let mentalHealth: number;
  while (true) {
    const response = await conversation.waitFor("message:text");
    const num = parseInt(response.message.text, 10);
    if (num >= 1 && num <= 10) {
      mentalHealth = num;
      break;
    }
    await response.reply("Give me a number between 1 and 10. I know it's hard to count when you're this addicted.");
  }

  await ctx.reply("Any comments? How are you feeling? (or send /skip)");

  const commentResponse = await conversation.waitFor("message:text");
  const comments =
    commentResponse.message.text === "/skip"
      ? ""
      : commentResponse.message.text;

  await conversation.external(() =>
    updateZynLog(pageId, { mentalHealth, comments })
  );

  const shame =
    mentalHealth <= 4
      ? "Your mental health is in the gutter and you're still using Zyn. Think about that."
      : mentalHealth <= 7
        ? "Mid mental health, mid choices. At least you're self-aware."
        : "High mental health score but still using Zyn? You don't even need it. Pathetic.";

  await ctx.reply(`Logged. ${shame}`);
}
