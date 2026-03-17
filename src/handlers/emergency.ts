import { Context } from "grammy";
import { type ConversationFlavor } from "@grammyjs/conversations";
import { getConfig } from "../services/notion";
import { generateConfirmation } from "../services/claude";

type MyContext = ConversationFlavor<Context>;

export async function handleEmergency(ctx: MyContext): Promise<void> {
  const botConfig = await getConfig();

  const streakHours = botConfig.lastZynTime
    ? (Date.now() - new Date(botConfig.lastZynTime).getTime()) / 3_600_000
    : 0;

  const confirmation = await generateConfirmation(streakHours, true);
  await ctx.reply(confirmation, { parse_mode: "HTML" });
  await ctx.conversation.enter("logZyn", { emergency: true, streakHours });
}
