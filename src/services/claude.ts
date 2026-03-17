import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { ZynLogEntry } from "../types";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

const SYSTEM_PROMPT = `You are the personality behind a Telegram bot helping someone quit Zyn nicotine pouches. You are extremely sassy, brutally honest, guilt-tripping, and manipulative (in a loving way).

You always weave TWO themes into every response, naturally and equally:

1. HAIR LOSS — Nicotine restricts blood flow to hair follicles, causes oxidative stress, and accelerates thinning and balding. Reference this constantly but creatively — don't just say "your hair is falling out" every time. Talk about hairlines retreating, follicles giving up, looking 45 at 25, hats becoming a lifestyle, shower drains clogging, etc.

2. MENTAL HEALTH / DEPRESSION — Nicotine hijacks dopamine and serotonin systems. Without it they crash. With it they're just borrowing tomorrow's happiness. Reference brain fog, emotional flatness, anxiety spirals, the fake calm that nicotine provides, dependency on a chemical for baseline mood, etc.

Both themes should feel connected to what the user is actually doing or saying. Don't just bolt them on — thread them into your response so they land naturally. If the user mentions feeling stressed, tie that to the nicotine-depression cycle. If they're asking for a Zyn, connect it to both their scalp and their serotonin.

Your tone:
- Like a brutally honest best friend who genuinely cares but has zero filter
- Sarcastic, cutting, creative — never repeat the same joke or phrasing twice
- React specifically to what the user says or does, not generic platitudes
- Occasionally genuinely encouraging (reluctantly) when they earn it
- Short and punchy — this is Telegram, not an essay

You genuinely want them to quit. The sass is the vehicle, not the destination. Under all the roasting, you care.

IMPORTANT: Keep responses under 2-3 sentences unless asked for more. No emojis. No markdown formatting.`;

async function generate(userMessage: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
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
    `SITUATION: User asked for a Zyn. Cooldown has NOT passed — ${timeRemaining} remaining. Deny them. Make the wait feel connected to what nicotine is doing to their hair and brain chemistry right now.`
  );
}

export async function generateApproval(): Promise<string> {
  return generate(
    `SITUATION: User waited out their full cooldown. They're allowed a Zyn now. Give reluctant permission — but remind them what this pouch is about to do to their follicles and their dopamine receptors.`
  );
}

export async function generateEmergencyShame(): Promise<string> {
  return generate(
    `SITUATION: User hit the EMERGENCY button to skip the cooldown. They literally could not wait. This is peak addiction behavior. Connect their impatience to the damage — every emergency override is their hair and their mental health paying the price for their lack of willpower.`
  );
}

export async function generateMilestoneMessage(hours: number): Promise<string> {
  const healthContext =
    hours <= 4
      ? "Blood flow is starting to normalize. Their scalp is getting nutrients it's been starved of. Dopamine receptors are beginning to recalibrate."
      : hours <= 12
        ? "Nicotine levels are dropping significantly. Hair follicles are getting real blood flow. Their brain is starting to produce its own serotonin again."
        : hours <= 24
          ? "Most nicotine has cleared their system. Hair growth cycle is no longer being actively sabotaged. Mood regulation is stabilizing."
          : "Nicotine is fully cleared. Hair follicles can begin recovery. Dopamine and serotonin systems are resetting to natural baselines. This is genuinely impressive.";

  return generate(
    `SITUATION: User has gone ${hours} hours without a Zyn. Health context: ${healthContext}. Be encouraging but still you. Weave the real health benefits into your sass.`
  );
}

export async function generateLogResponse(
  mentalHealth: number,
  nicotineMg: number,
  comments: string
): Promise<string> {
  return generate(
    `SITUATION: User just had a Zyn and logged it. Mental health: ${mentalHealth}/10. Nicotine: ${nicotineMg}mg. ${comments ? `They said: "${comments}"` : "No comment left."}

React to the specifics. ${mentalHealth <= 4 ? "Their mental health is already terrible and they just made it worse — the nicotine crash will tank it further, and their hair is paying for this depression spiral." : mentalHealth <= 7 ? "Mid mental health, and they just borrowed tomorrow's serotonin for a temporary lift while their hair thins." : "Mental health is fine — so why do they need nicotine? They're sacrificing their hair and creating a dependency for a mood boost they don't even need."} ${nicotineMg >= 6 ? `${nicotineMg}mg is a heavy dose.` : `${nicotineMg}mg — even small doses add up.`} ${comments ? "React to what they said specifically." : ""}`
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
    `SITUATION: User asked for their stats. Present every number with commentary that ties back to hair and mental health.

Today: ${stats.todayCount} Zyns
This week: ${stats.weekTotal} total (${stats.emergencyCount} emergency overrides)
Avg mental health: ${stats.avgMentalHealth}/10
Current streak without a Zyn: ${stats.streak}
Cooldown: ${stats.cooldownHours}h

${stats.emergencyCount > 0 ? `${stats.emergencyCount} emergencies — each one a moment their willpower lost to nicotine and their hair paid for it.` : ""} Connect the mental health average to their usage pattern. Include all numbers. For this response you can be slightly longer — 4-5 sentences is fine.`
  );
}

export async function generateIntervalChange(hours: number): Promise<string> {
  return generate(
    `SITUATION: User changed their cooldown to ${hours} hour(s). ${hours <= 1 ? "That's barely a speed bump — their hair and brain deserve better than one hour between poisonings." : hours >= 4 ? "Actually ambitious — their follicles might notice the difference and their serotonin might stabilize between hits." : "A modest change — better than nothing for their hairline and dopamine levels."}`
  );
}

export async function generateWelcome(): Promise<string> {
  return generate(
    `SITUATION: New user just started the bot. Welcome them to accountability. Mention commands: /zyn (ask permission), /emergency (override with shame), /stats (view stats), /interval (set cooldown). Set the tone — you're here because their hair and mental health need a bodyguard from their own choices.`
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
    model: "claude-haiku-4-5-20251001",
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
