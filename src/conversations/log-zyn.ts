import { type Conversation, type ConversationFlavor } from "@grammyjs/conversations";
import { Context } from "grammy";
import { updateZynLog } from "../services/notion";
import { generateLogResponse } from "../services/claude";

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

export async function logZynConversation(
  conversation: MyConversation,
  ctx: MyContext,
  pageId: string
): Promise<void> {

  await ctx.reply("Rate your mental health right now (1-10):");

  let mentalHealth: number;
  while (true) {
    const response = await conversation.waitFor("message:text");
    const num = parseInt(response.message.text, 10);
    if (num >= 1 && num <= 10) {
      mentalHealth = num;
      break;
    }
    await response.reply("Give me a number between 1 and 10.");
  }

  await ctx.reply("How many mg? (e.g. 3, 6, 9)");

  let nicotineMg: number;
  while (true) {
    const mgResponse = await conversation.waitFor("message:text");
    const mg = parseFloat(mgResponse.message.text);
    if (!isNaN(mg) && mg > 0) {
      nicotineMg = mg;
      break;
    }
    await mgResponse.reply("Give me a positive number.");
  }

  await ctx.reply("Any comments? How are you feeling? (or send /skip)");

  const commentResponse = await conversation.waitFor("message:text");
  const comments =
    commentResponse.message.text === "/skip"
      ? ""
      : commentResponse.message.text;

  await conversation.external(() =>
    updateZynLog(pageId, { mentalHealth, nicotineMg, comments })
  );

  const response = await conversation.external(() =>
    generateLogResponse(mentalHealth, nicotineMg, comments)
  );

  await ctx.reply(response);
}
