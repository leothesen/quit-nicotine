import Anthropic from "@anthropic-ai/sdk";
import { Context } from "grammy";
import { type ConversationFlavor } from "@grammyjs/conversations";
import { config } from "../config";
import { getConfig } from "../services/notion";
import { handleZyn } from "./zyn";
import { handleEmergency } from "./emergency";
import { handleStats } from "./stats";
import { handleInterval } from "./settings";

type MyContext = ConversationFlavor<Context>;

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

// In-memory message history per chat (keeps last 20 messages)
const chatHistories = new Map<number, Array<{ role: "user" | "assistant"; content: string }>>();

const MAX_HISTORY = 20;

function getHistory(chatId: number): Array<{ role: "user" | "assistant"; content: string }> {
  if (!chatHistories.has(chatId)) {
    chatHistories.set(chatId, []);
  }
  return chatHistories.get(chatId)!;
}

export function addToHistory(chatId: number, role: "user" | "assistant", content: string): void {
  const history = getHistory(chatId);
  history.push({ role, content });
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}

const ROUTER_SYSTEM = `You are the personality behind a Telegram bot helping someone quit Zyn nicotine pouches. You are extremely sassy, brutally honest, guilt-tripping, and manipulative (in a loving way).

You always weave TWO themes into every response naturally:
1. HAIR LOSS — Nicotine restricts blood flow to hair follicles, causes thinning and balding.
2. MENTAL HEALTH / DEPRESSION — Nicotine hijacks dopamine and serotonin. They're borrowing tomorrow's happiness.

Your tone: brutally honest best friend with zero filter. Sarcastic, creative, punchy. You genuinely care underneath.

You have tools available. Use them when the user's intent matches:
- request_zyn: When the user wants a Zyn, asks for permission, says they're craving one, etc.
- request_emergency: When the user wants to bypass the cooldown / needs one NOW / says it's urgent.
- get_stats: When the user asks about their stats, progress, how they're doing, usage numbers.
- set_interval: When the user wants to change their cooldown timer.

If the user is just chatting, venting, asking questions, or talking about their journey — respond directly WITHOUT using any tools. Stay in character. Keep responses under 2-3 sentences. No emojis.

FORMATTING — Use Telegram HTML tags naturally:
- <b>bold</b> for milestones, key numbers, things that should hit hard
- <i>italic</i> for sarcastic asides, subtle emphasis
- <s>strikethrough</s> to cross out old habits or bad choices
- <code>code</code> for exact values and stats
Use 2-3 formatting elements per message max. Never use markdown — only HTML tags.

Use line breaks between sentences. Each thought or sentiment gets its own line — never return a wall of text.

CRITICAL: ONLY use HTML tags for formatting. Never use *asterisks*, _underscores_, or backticks. Use <b>, <i>, <code>, <s> tags exclusively.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "request_zyn",
    description: "User wants to have a Zyn / is asking for permission / is craving one",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "request_emergency",
    description: "User wants to bypass the cooldown and have a Zyn immediately / says it's an emergency / can't wait",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_stats",
    description: "User wants to see their stats / progress / how they're doing / usage numbers",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "set_interval",
    description: "User wants to change their cooldown interval",
    input_schema: {
      type: "object" as const,
      properties: {
        hours: { type: "number", description: "The new cooldown in hours" },
      },
      required: ["hours"],
    },
  },
];

export async function handleFreeText(ctx: MyContext): Promise<void> {
  const text = ctx.message?.text;
  if (!text) return;

  const chatId = ctx.chat!.id;
  addToHistory(chatId, "user", text);

  // Build messages from history
  const history = getHistory(chatId);
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Get current streak for context
  const botConfig = await getConfig();
  const streakInfo = botConfig.lastZynTime
    ? `User's current streak: ${Math.floor((Date.now() - new Date(botConfig.lastZynTime).getTime()) / 3_600_000)} hours without a Zyn.`
    : "No previous Zyn logged yet.";

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    temperature: 1,
    system: `${ROUTER_SYSTEM}\n\nContext: ${streakInfo} Cooldown: ${botConfig.intervalHours}h.`,
    tools: TOOLS,
    messages,
  });

  // Check if Claude wants to use a tool
  const toolUse = response.content.find((b) => b.type === "tool_use");

  if (toolUse) {
    switch (toolUse.name) {
      case "request_zyn":
        await handleZyn(ctx);
        return;
      case "request_emergency":
        await handleEmergency(ctx);
        return;
      case "get_stats":
        await handleStats(ctx);
        return;
      case "set_interval": {
        const input = toolUse.input as { hours: number };
        // Inject the interval into the message so handleInterval can parse it
        if (ctx.message) {
          (ctx.message as any).text = `/interval ${input.hours}`;
        }
        await handleInterval(ctx);
        return;
      }
    }
  }

  // No tool — just a text response
  const textBlock = response.content.find((b) => b.type === "text");
  const reply = textBlock?.text ?? "I'm speechless. And not in a good way.";

  addToHistory(chatId, "assistant", reply);
  await ctx.reply(reply, { parse_mode: "HTML" });
}
