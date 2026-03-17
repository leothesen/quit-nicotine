import { Context } from "grammy";
import { type ConversationFlavor } from "@grammyjs/conversations";
import { createZynLog } from "../services/notion";
import { getEmergencyShame } from "../services/personality";

type MyContext = ConversationFlavor<Context>;

export async function handleEmergency(ctx: MyContext): Promise<void> {
  const timestamp = new Date().toISOString();
  const pageId = await createZynLog({ timestamp, emergency: true });

  await ctx.reply(getEmergencyShame());
  await ctx.conversation.enter("logZyn", pageId);
}
