import { Context } from "grammy";
import { getConfig, updateConfig } from "../services/notion";

export async function handleInterval(ctx: Context): Promise<void> {
  const text = ctx.message?.text ?? "";
  const parts = text.split(/\s+/);
  const arg = parts[1];

  if (!arg) {
    const botConfig = await getConfig();
    await ctx.reply(`Current cooldown: ${botConfig.intervalHours} hour(s).`);
    return;
  }

  const hours = parseFloat(arg);
  if (isNaN(hours) || hours <= 0) {
    await ctx.reply("Give me a positive number. Even your Zyn habit has higher standards.");
    return;
  }

  await updateConfig({ intervalHours: hours });
  await ctx.reply(`Cooldown set to ${hours} hour(s). The longer the better — for your hair.`);
}
