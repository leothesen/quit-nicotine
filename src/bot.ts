import { Bot, Context, session } from "grammy";
import { conversations, createConversation, type ConversationFlavor } from "@grammyjs/conversations";
import { config } from "./config";
import { updateConfig } from "./services/notion";
import { handleZyn } from "./handlers/zyn";
import { handleEmergency } from "./handlers/emergency";
import { handleStats } from "./handlers/stats";
import { handleInterval } from "./handlers/settings";
import { logZynConversation } from "./conversations/log-zyn";

interface SessionData {
  pendingZynPageId?: string;
}

type MyContext = ConversationFlavor<Context & { session: SessionData }>;

export function createBot(): Bot<MyContext> {
  const bot = new Bot<MyContext>(config.telegramToken);

  bot.use(
    session({
      initial: (): SessionData => ({}),
    })
  );
  bot.use(conversations());
  bot.use(createConversation(logZynConversation, "logZyn"));

  bot.command("start", async (ctx) => {
    const chatId = ctx.chat.id;
    await updateConfig({ chatId });
    await ctx.reply(
      "Welcome to your Zyn accountability bot. I'm here to make you feel bad about your choices.\n\n" +
        "Commands:\n" +
        "/zyn — Ask permission for a Zyn\n" +
        "/emergency — Emergency override (maximum shame)\n" +
        "/stats — View your stats\n" +
        "/interval — View/set cooldown hours\n\n" +
        "Your hair follicles are counting on you."
    );
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

  bot.catch((err) => {
    console.error("Bot error:", err);
  });

  return bot;
}
