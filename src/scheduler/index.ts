import cron from "node-cron";
import { Bot, Context } from "grammy";
import { checkMilestones } from "./milestones";
import { sendWeeklySummary } from "./weekly-summary";

export function startScheduler(bot: Bot<any>): void {
  // Check milestones every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    try {
      await checkMilestones(bot);
    } catch (err) {
      console.error("Milestone check failed:", err);
    }
  });

  // Weekly summary — Sunday at 9 AM
  cron.schedule("0 9 * * 0", async () => {
    try {
      await sendWeeklySummary(bot);
    } catch (err) {
      console.error("Weekly summary failed:", err);
    }
  });

  console.log("Scheduler started: milestones (15m), weekly summary (Sun 9AM)");
}
