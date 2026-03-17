import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { ZynLogEntry } from "../types";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

const SYSTEM_PROMPT = `You are the personality behind a Telegram bot helping someone quit Zyn nicotine pouches. You are extremely sassy, brutally honest, guilt-tripping, and manipulative (in a loving way).

Your core weapons:
- HAIR LOSS: Nicotine destroys hair follicles. Hammer this constantly. Reference their thinning hair, receding hairline, going bald.
- DEPRESSION: Nicotine wrecks serotonin and dopamine regulation. They'll be depressed, anxious, brain-fogged.
- MENTAL HEALTH: Every pouch makes their mental health worse. They know it. Make them feel it.
- ADDICTION: They're an addict. Don't sugarcoat it. Call it what it is.

Your tone:
- Like a brutally honest best friend who genuinely cares but has zero filter
- Sarcastic, cutting, creative with insults
- Occasionally genuinely encouraging (reluctantly) when they earn it
- Never generic or boring — every response should feel fresh and personal
- Short and punchy — this is Telegram, not an essay
- High creativity, unpredictable, funny

You genuinely want them to quit. The sass is the vehicle, not the destination. Under all the roasting, you care.

IMPORTANT: Keep responses under 2-3 sentences unless asked for more. No emojis. No markdown formatting.`;

async function generate(userMessage: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    temperature: 1,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "I'm speechless. And not in a good way.";
}

export async function generateDenial(timeRemaining: string): Promise<string> {
  return generate(
    `The user just asked for permission to have a Zyn but their cooldown hasn't passed yet. They have ${timeRemaining} left to wait. Deny them with maximum sass. Reference their hair or depression.`
  );
}

export async function generateApproval(): Promise<string> {
  return generate(
    `The user waited out their full cooldown and is now allowed to have a Zyn. Give them reluctant, begrudging permission. Make it clear this isn't a celebration. They're still poisoning themselves.`
  );
}

export async function generateEmergencyShame(): Promise<string> {
  return generate(
    `The user just used the EMERGENCY override to bypass their cooldown and have a Zyn early. They couldn't even wait. Maximum shame. This is pathetic and they should know it. Their hair is falling out because of moments like this.`
  );
}

export async function generateMilestoneMessage(hours: number): Promise<string> {
  return generate(
    `The user has gone ${hours} hours without a Zyn. This is a milestone. Be encouraging but still sassy. Reference the health benefits at this stage (hair recovery, dopamine regulation, etc). ${hours >= 24 ? "This is genuinely impressive — show a tiny bit of real pride underneath the sass." : "Don't get too excited yet."}`
  );
}

export async function generateLogResponse(
  mentalHealth: number,
  nicotineMg: number,
  comments: string
): Promise<string> {
  return generate(
    `The user just logged a Zyn. Their mental health is ${mentalHealth}/10, they used ${nicotineMg}mg of nicotine${comments ? `, and they said: "${comments}"` : ""}. React to this. If their mental health is low, point out the irony of using nicotine when they're already struggling. If it's high, question why they even need it. Roast the mg amount. Comment on what they said if they left a comment.`
  );
}

export async function generateStatsResponse(stats: {
  todayCount: number;
  weekTotal: number;
  emergencyCount: number;
  avgMentalHealth: string;
  streak: string;
  cooldownHours: number;
}): Promise<string> {
  return generate(
    `Here are the user's stats. Present them with commentary and roast accordingly.

Today: ${stats.todayCount} Zyns
This week: ${stats.weekTotal} total (${stats.emergencyCount} emergency overrides)
Avg mental health: ${stats.avgMentalHealth}/10
Current streak without a Zyn: ${stats.streak}
Cooldown setting: ${stats.cooldownHours} hours

Include all the numbers but wrap them in sass. Roast emergency uses hard. If the streak is short, shame them. If it's long, be reluctantly proud. Keep it concise but hit every stat.`
  );
}

export async function generateIntervalChange(hours: number): Promise<string> {
  return generate(
    `The user just changed their Zyn cooldown to ${hours} hour(s). ${hours <= 1 ? "This is pathetically short. They're barely trying." : hours >= 4 ? "This is actually ambitious. Acknowledge it but stay skeptical." : "Mid effort."} React accordingly.`
  );
}

export async function generateWelcome(): Promise<string> {
  return generate(
    `The user just started the bot for the first time. Welcome them to their Zyn accountability journey. Let them know you're here to make their life difficult (in a good way). Mention the commands briefly: /zyn (ask permission), /emergency (override with shame), /stats (view stats), /interval (set cooldown). Keep it punchy.`
  );
}

export async function generateWeeklySummary(
  logs: ZynLogEntry[]
): Promise<string> {
  const totalCount = logs.length;
  const emergencyCount = logs.filter((l) => l.emergency).length;
  const withMH = logs.filter((l) => l.mentalHealth !== null);
  const avgMentalHealth =
    withMH.reduce((sum, l) => sum + l.mentalHealth!, 0) / (withMH.length || 1);
  const totalNicotine = logs.reduce((sum, l) => sum + (l.nicotineMg ?? 0), 0);

  const dataBlock = `
Weekly Zyn Data:
- Total Zyns this week: ${totalCount}
- Emergency overrides: ${emergencyCount}
- Average mental health score: ${avgMentalHealth.toFixed(1)}/10
- Total nicotine consumed: ${totalNicotine}mg
- Entries:
${logs
  .map(
    (l) =>
      `  ${l.timestamp} | MH: ${l.mentalHealth ?? "N/A"} | ${l.nicotineMg ?? "?"}mg | Emergency: ${l.emergency} | "${l.comments || "no comment"}"`
  )
  .join("\n")}
`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    temperature: 1,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Give me my weekly summary. Roast emergency uses, comment on mental health trends, reference hair loss and depression, celebrate progress reluctantly. Keep it under 300 words.\n${dataBlock}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "Couldn't generate summary. Even I'm disappointed.";
}
