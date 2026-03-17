import { Context } from "grammy";
import { type ConversationFlavor } from "@grammyjs/conversations";
import { getConfig, createZynLog } from "../services/notion";
import { generateDenial, generateApproval } from "../services/claude";

function formatTimeRemaining(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

type MyContext = ConversationFlavor<Context>;

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
      const denial = await generateDenial(formatTimeRemaining(remaining));
      await ctx.reply(denial);
      return;
    }
  }

  const timestamp = new Date().toISOString();
  const pageId = await createZynLog({ timestamp, emergency: false });

  const approval = await generateApproval();
  await ctx.reply(approval);
  await ctx.conversation.enter("logZyn", pageId);
}
