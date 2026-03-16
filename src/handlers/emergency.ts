import { Context } from "grammy";
import { type ConversationFlavor } from "@grammyjs/conversations";
import { createZynLog } from "../services/notion";
import { getEmergencyShame } from "../services/personality";

type MyContext = ConversationFlavor<Context & { session: { pendingZynPageId?: string } }>;

export async function handleEmergency(ctx: MyContext): Promise<void> {
  const timestamp = new Date().toISOString();
  const pageId = await createZynLog({ timestamp, emergency: true });

  ctx.session.pendingZynPageId = pageId;
  await ctx.reply(getEmergencyShame());
  await ctx.conversation.enter("logZyn");
}
