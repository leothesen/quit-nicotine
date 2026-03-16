import { Context } from "grammy";
import { type ConversationFlavor } from "@grammyjs/conversations";
import { getConfig, createZynLog } from "../services/notion";
import { getDenial, getApproval, formatTimeRemaining } from "../services/personality";

type MyContext = ConversationFlavor<Context & { session: { pendingZynPageId?: string } }>;

export async function handleZyn(ctx: MyContext): Promise<void> {
  const botConfig = await getConfig();

  if (!botConfig.botActive) {
    await ctx.reply("Bot is paused. Lucky you.");
    return;
  }

  const now = Date.now();
  const cooldownMs = botConfig.intervalHours * 60 * 60 * 1000;

  if (botConfig.lastZynTime) {
    const lastTime = new Date(botConfig.lastZynTime).getTime();
    const elapsed = now - lastTime;

    if (elapsed < cooldownMs) {
      const remaining = cooldownMs - elapsed;
      await ctx.reply(getDenial(formatTimeRemaining(remaining)));
      return;
    }
  }

  const timestamp = new Date().toISOString();
  const pageId = await createZynLog({ timestamp, emergency: false });

  ctx.session.pendingZynPageId = pageId;
  await ctx.reply(getApproval());
  await ctx.conversation.enter("logZyn");
}
