import { Context } from "grammy";
import { getRecentLogs, getTodayCount, getConfig } from "../services/notion";
import { generateStatsResponse } from "../services/claude";

export async function handleStats(ctx: Context): Promise<void> {
  const [todayCount, weekLogs, botConfig] = await Promise.all([
    getTodayCount(),
    getRecentLogs(7),
    getConfig(),
  ]);

  const withMH = weekLogs.filter((l) => l.mentalHealth !== null);
  const avgMH =
    withMH.length > 0
      ? (withMH.reduce((s, l) => s + l.mentalHealth!, 0) / withMH.length).toFixed(1)
      : "N/A";

  const emergencyCount = weekLogs.filter((l) => l.emergency).length;

  let streak = "N/A";
  if (botConfig.lastZynTime) {
    const elapsed = Date.now() - new Date(botConfig.lastZynTime).getTime();
    const hours = Math.floor(elapsed / 3_600_000);
    const minutes = Math.floor((elapsed % 3_600_000) / 60_000);
    streak = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  const response = await generateStatsResponse({
    todayCount,
    weekTotal: weekLogs.length,
    emergencyCount,
    avgMentalHealth: avgMH,
    streak,
    cooldownHours: botConfig.intervalHours,
  });

  await ctx.reply(response, { parse_mode: "HTML" });
}
