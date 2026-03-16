import { Bot } from "grammy";
import { getConfig, getRecentLogs, updateZynLog } from "../services/notion";
import { generateWeeklySummary } from "../services/claude";

export async function sendWeeklySummary(bot: Bot<any>): Promise<void> {
  const botConfig = await getConfig();
  if (!botConfig.chatId) return;

  const logs = await getRecentLogs(7);

  if (logs.length === 0) {
    await bot.api.sendMessage(
      botConfig.chatId,
      "No Zyns this week?! Either you're cured or you're lying. Either way, I'm watching you."
    );
    return;
  }

  const summary = await generateWeeklySummary(logs);

  await bot.api.sendMessage(botConfig.chatId, `*Weekly Summary*\n\n${summary}`, {
    parse_mode: "Markdown",
  });

  // Tag the most recent log with the weekly insight
  await updateZynLog(logs[0].id, { weeklyInsight: summary.slice(0, 2000) });
}
