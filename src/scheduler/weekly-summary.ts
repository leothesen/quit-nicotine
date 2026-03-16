import { Bot } from "grammy";
import { getConfig, getRecentLogs, createWeeklySummaryEntry } from "../services/notion";
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

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const withMH = logs.filter((l) => l.mentalHealth !== null);
  const avgMH =
    withMH.length > 0
      ? withMH.reduce((s, l) => s + l.mentalHealth!, 0) / withMH.length
      : 0;

  await createWeeklySummaryEntry({
    weekStart: weekStart.toISOString(),
    weekEnd: now.toISOString(),
    totalZyns: logs.length,
    emergencyCount: logs.filter((l) => l.emergency).length,
    avgMentalHealth: avgMH,
    summary,
  });
}
