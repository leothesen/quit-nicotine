import { Bot } from "grammy";
import { getConfig } from "../services/notion";
import { generateMilestoneMessage } from "../services/claude";

const MILESTONE_HOURS = [
  2, 4, 8, 12, 24,           // day 1
  48, 72,                     // days 2-3
  96, 120,                    // days 4-5 (peak sleep disruption)
  168,                        // 1 week
  336,                        // 2 weeks (circulation + sleep normalize)
  504,                        // 3 weeks
  720,                        // 1 month (anxiety/brain fog decline)
  1440,                       // 2 months
  2160,                       // 3 months (dopamine baseline restored)
  4320,                       // 6 months (hair recovery visible)
];

const sentMilestones = new Set<number>();

let lastKnownZynTime: string | null = null;

export async function checkMilestones(bot: Bot<any>): Promise<void> {
  const botConfig = await getConfig();

  if (!botConfig.botActive || !botConfig.chatId || !botConfig.lastZynTime) return;

  // Reset sent milestones if a new Zyn was logged
  if (botConfig.lastZynTime !== lastKnownZynTime) {
    sentMilestones.clear();
    lastKnownZynTime = botConfig.lastZynTime;
  }

  const elapsed = Date.now() - new Date(botConfig.lastZynTime).getTime();
  const elapsedHours = elapsed / 3_600_000;

  for (const milestone of MILESTONE_HOURS) {
    if (elapsedHours >= milestone && !sentMilestones.has(milestone)) {
      const message = await generateMilestoneMessage(milestone);
      await bot.api.sendMessage(botConfig.chatId, message, { parse_mode: "HTML" });
      sentMilestones.add(milestone);
    }
  }
}
