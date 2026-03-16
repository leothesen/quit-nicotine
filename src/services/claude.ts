import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { ZynLogEntry } from "../types";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

const SYSTEM_PROMPT = `You are the personality behind a Telegram bot helping someone quit Zyn nicotine pouches. You are sassy, manipulative (in a loving way), and you guilt-trip about hair loss and depression caused by nicotine.

Your job is to analyze the user's weekly Zyn usage data and generate a summary that:
- Roasts them for emergency uses
- Celebrates genuine progress (reluctantly)
- Points out mental health trends
- References hair loss and depression as motivation
- Keeps it under 300 words
- Uses a conversational, direct tone — like a brutally honest friend

Be funny but genuinely caring underneath the sass. The goal is to help them quit.`;

export async function generateWeeklySummary(
  logs: ZynLogEntry[]
): Promise<string> {
  const totalCount = logs.length;
  const emergencyCount = logs.filter((l) => l.emergency).length;
  const avgMentalHealth =
    logs.filter((l) => l.mentalHealth !== null).reduce((sum, l) => sum + l.mentalHealth!, 0) /
      (logs.filter((l) => l.mentalHealth !== null).length || 1);

  const dataBlock = `
Weekly Zyn Data:
- Total Zyns this week: ${totalCount}
- Emergency overrides: ${emergencyCount}
- Average mental health score: ${avgMentalHealth.toFixed(1)}/10
- Entries:
${logs
  .map(
    (l) =>
      `  ${l.timestamp} | MH: ${l.mentalHealth ?? "N/A"} | Emergency: ${l.emergency} | "${l.comments || "no comment"}"`
  )
  .join("\n")}
`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here's my Zyn data for this week. Give me my weekly summary.\n${dataBlock}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "Couldn't generate summary. Even Claude is disappointed.";
}
