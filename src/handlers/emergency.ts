import { Context } from "grammy";
import { type ConversationFlavor } from "@grammyjs/conversations";
import { createZynLog } from "../services/notion";
import { generateEmergencyShame } from "../services/claude";

type MyContext = ConversationFlavor<Context>;

export async function handleEmergency(ctx: MyContext): Promise<void> {
  const timestamp = new Date().toISOString();
  const pageId = await createZynLog({ timestamp, emergency: true });

  const shame = await generateEmergencyShame();
  await ctx.reply(shame);
  await ctx.conversation.enter("logZyn", pageId);
}
