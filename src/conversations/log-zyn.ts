import { type Conversation, type ConversationFlavor } from "@grammyjs/conversations";
import { Context } from "grammy";
import { createZynLog, updateZynLog } from "../services/notion";
import { generateLogResponse, generateApproval, generateEmergencyShame } from "../services/claude";

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

export async function logZynConversation(
  conversation: MyConversation,
  ctx: MyContext,
  opts: { emergency: boolean; streakHours: number }
): Promise<void> {
  // Wait for confirmation
  const confirmResponse = await conversation.waitFor("message:text");
  const answer = confirmResponse.message.text.toLowerCase().trim();

  if (!["yes", "y", "yeah", "yep", "sure", "do it", "yes."].includes(answer)) {
    await confirmResponse.reply("Good. Your hair and your serotonin thank you. Stay strong.");
    return;
  }

  // They confirmed — create the log now
  const timestamp = new Date().toISOString();
  const pageId = await conversation.external(() =>
    createZynLog({ timestamp, emergency: opts.emergency })
  );

  // Send approval/shame message
  const reactionMsg = await conversation.external(() =>
    opts.emergency ? generateEmergencyShame() : generateApproval()
  );
  await ctx.reply(reactionMsg, { parse_mode: "HTML" });

  // Mental health
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

  // Nicotine mg
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

  // Comments
  await ctx.reply("Any comments? How are you feeling? (or send /skip)");

  const commentResponse = await conversation.waitFor("message:text");
  const comments =
    commentResponse.message.text === "/skip"
      ? ""
      : commentResponse.message.text;

  // Update the log entry
  await conversation.external(() =>
    updateZynLog(pageId, { mentalHealth, nicotineMg, comments })
  );

  // Final response
  const response = await conversation.external(() =>
    generateLogResponse(mentalHealth, nicotineMg, comments)
  );

  await ctx.reply(response, { parse_mode: "HTML" });
}
