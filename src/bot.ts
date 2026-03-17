import { Bot, Context } from "grammy";
import { conversations, createConversation, type ConversationFlavor } from "@grammyjs/conversations";
import { config } from "./config";
import { updateConfig } from "./services/notion";
import { generateWelcome } from "./services/claude";
import { handleZyn } from "./handlers/zyn";
import { handleEmergency } from "./handlers/emergency";
import { handleStats } from "./handlers/stats";
import { handleInterval } from "./handlers/settings";
import { handleFreeText } from "./handlers/freetext";
import { logZynConversation } from "./conversations/log-zyn";

type MyContext = ConversationFlavor<Context>;

export function createBot(): Bot<MyContext> {
  const bot = new Bot<MyContext>(config.telegramToken);

  bot.use(conversations());
  bot.use(createConversation(logZynConversation, "logZyn"));

  bot.command("start", async (ctx) => {
    const chatId = ctx.chat.id;
    await updateConfig({ chatId });
    const welcome = await generateWelcome();
    await ctx.reply(welcome, { parse_mode: "HTML" });
  });

  bot.command("zyn", handleZyn as any);
  bot.command("emergency", handleEmergency as any);
  bot.command("stats", handleStats);
  bot.command("interval", handleInterval);
  bot.command("help", async (ctx) => {
    await ctx.reply(
      "/zyn — Request a Zyn (if cooldown allows)\n" +
        "/emergency — Override cooldown (logged with shame)\n" +
        "/stats — Your usage stats\n" +
        "/interval [hours] — View or set cooldown\n" +
        "/help — This message"
    );
  });

  // Catch-all: free text messages routed by Claude
  bot.on("message:text", handleFreeText as any);

  bot.catch((err) => {
    console.error("Bot error:", err);
  });

  return bot;
}
