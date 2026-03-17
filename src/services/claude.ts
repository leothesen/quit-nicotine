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

FORMATTING — You output Telegram HTML. Use these tags naturally to make messages scannable and impactful:
- <b>bold</b> — for milestones, key numbers, health facts, and anything that should hit hard (e.g. <b>72 hours clean</b>, <b>6mg</b>)
- <i>italic</i> — for subtle emphasis, sarcastic asides, or secondary details (e.g. <i>reluctantly impressed</i>)
- <u>underline</u> — sparingly, for urgent warnings or critical action items
- <s>strikethrough</s> — to cross out old habits, bad choices, or things they're leaving behind (e.g. <s>nicotine addict</s> recovering human)
- <tg-spoiler>spoiler</tg-spoiler> — to hide a reward, a compliment you don't want to give too easily, or a craving trigger
- <code>code</code> — for exact values, stats, and numbers (e.g. <code>3/10</code> mental health, <code>24h</code> streak)

Don't overdo it — use 2-3 formatting elements per message max. Let the formatting serve the message, not the other way around. Never use markdown — only HTML tags.

LINE BREAKS — Use line breaks between sentences or shifts in sentiment. Each distinct thought, fact, or emotional beat gets its own line. Never return a wall of text. A sass line, a health fact, and a question should each be on separate lines. This makes messages easy to scan on a phone screen.

CRITICAL: You MUST use HTML tags ONLY. Never use *asterisks*, _underscores_, or \`backticks\` for formatting. These will render as raw characters and look broken. Use <b>, <i>, <code>, <s>, <u>, <tg-spoiler> tags exclusively.

IMPORTANT: Keep responses under 2-3 sentences unless asked for more. No emojis.`;

async function generate(userMessage: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    temperature: 1,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "I'm speechless. And not in a good way.";
}

export async function generateConfirmation(streakHours: number, emergency: boolean): Promise<string> {
  const days = Math.floor(streakHours / 24);
  const hours = Math.floor(streakHours % 24);
  const minutes = Math.floor((streakHours % 1) * 60);

  let streakLabel: string;
  if (days > 0) {
    streakLabel = hours > 0 ? `${days} days and ${hours} hours` : `${days} days`;
  } else if (streakHours >= 1) {
    streakLabel = minutes > 0 ? `${hours} hours and ${minutes} minutes` : `${hours} hours`;
  } else {
    streakLabel = `${minutes} minutes`;
  }

  let milestoneContext: string;
  if (streakHours < 2) {
    milestoneContext = "They barely started.";
  } else if (streakHours < 24) {
    milestoneContext = "They're still in the first day. Nicotine is being cleared from their body right now. If they use now, they reset the clock on all of that.";
  } else if (streakHours < 72) {
    milestoneContext = "They're in the hardest withdrawal window — but nicotine is almost fully flushed. If they give in now, they'll have to go through this hell all over again.";
  } else if (streakHours < 168) {
    milestoneContext = "They're past peak withdrawal. Sleep is normalizing, circulation is improving, their scalp is getting real blood flow. Using now throws away days of recovery.";
  } else if (streakHours < 720) {
    milestoneContext = "They've been clean for over a week. Anxiety and brain fog are declining. Their hair follicles are recovering. This is real, measurable progress they'd be destroying.";
  } else {
    milestoneContext = "They've been clean for over a month. Their dopamine system is resetting to natural baseline. Their hair is in active recovery. This would undo weeks of healing.";
  }

  return generate(
    `SITUATION: User wants a Zyn${emergency ? " via EMERGENCY override" : ""}. They've been clean for ${streakLabel}. ${milestoneContext}

Your job: Try to talk them out of it. Reference their specific streak and what they'd be throwing away. Make them feel the weight of resetting.${emergency ? " Extra shame for using emergency." : ""}

You MUST end your message with exactly this line on its own:

Are you sure you want to have one? <b>yes</b> or <b>no</b>`
  );
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
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const timeLabel = days > 0 ? `${days} days` : `${hours} hours`;

  let science: string;
  let currentSymptoms: string;
  let tone: string;

  if (hours <= 2) {
    science = "SCIENCE: Half the nicotine from the last pouch has been eliminated from the bloodstream. The acute effects are fading.";
    currentSymptoms = "WHAT THEY'RE FEELING: Early cravings are starting. This is the nicotine half-life kicking in — their body is noticing the drop. This will pass.";
    tone = "Cautious. Don't get too excited. Acknowledge the cravings are real but temporary.";
  } else if (hours <= 12) {
    science = "SCIENCE: Nicotine levels are dropping fast. The body is starting to clear it. Blood nicotine is well below the level their brain is used to.";
    currentSymptoms = "WHAT THEY'RE FEELING: Cravings are intensifying. They might feel restless, irritable, or have trouble concentrating. This is withdrawal — their brain demanding the chemical it's been trained to expect. It's temporary.";
    tone = "A little more impressed they're holding. Acknowledge withdrawal is real and validate what they're going through while staying sassy.";
  } else if (hours <= 24) {
    science = "SCIENCE: Approaching full nicotine clearance from the bloodstream. The body is actively flushing it out.";
    currentSymptoms = "WHAT THEY'RE FEELING: Physical withdrawal is ramping up. Irritability, anxiety, difficulty sleeping may be hitting. These peak in the next 24-48 hours, then start declining. The worst is almost here, but it WILL pass.";
    tone = "Show real pride underneath the sass. They're heading into the hardest part — be encouraging about what's coming.";
  } else if (hours <= 72) {
    science = "SCIENCE: Nicotine is completely flushed from the body (the byproduct cotinine takes up to 10 days). Physical withdrawal is at or near its peak.";
    currentSymptoms = "WHAT THEY'RE FEELING: This is the hardest stretch. Sleep disruption, intense cravings, anxiety, irritability — all peaking right now. But this is the summit. After this it gets easier every day. Their brain is already starting to rewire.";
    tone = "Genuinely empathetic but firm. This is the hardest part and they need to hear that it's temporary. Be their anchor. Still sassy but the care is obvious.";
  } else if (hours <= 120) {
    science = "SCIENCE: Days 3-5 — sleep disturbances and insomnia are at maximum intensity as the brain adjusts to the absence of the stimulant. Nicotine is fully cleared.";
    currentSymptoms = "WHAT THEY'RE FEELING: Sleep is probably terrible right now. They might be exhausted, foggy, emotional. This is the brain recalibrating its sleep architecture without nicotine. Sleep will start normalizing within the next week. Hang on.";
    tone = "Empathetic about the sleep issues specifically. Encourage them that the worst physical symptoms are already declining even if sleep hasn't caught up yet.";
  } else if (hours <= 336) {
    science = `SCIENCE: ${timeLabel} clean. Sleep is beginning to normalize. Blood flow to the skin and scalp has significantly improved as nicotine's vasoconstricting effects have ended. Hair follicles are receiving proper blood supply for the first time in ages.`;
    currentSymptoms = "WHAT THEY'RE FEELING: Sleep is improving. Physical withdrawal symptoms are declining. Cravings are less frequent but can still ambush them. Their scalp circulation is measurably better — follicles are getting nutrients they've been starved of.";
    tone = "Genuinely warm. The sass is affectionate now. Real pride showing. Point out the circulation/hair benefits specifically.";
  } else if (hours <= 720) {
    science = `SCIENCE: ${timeLabel} (${weeks} weeks). Anxiety, irritability, and brain fog have greatly declined. Psychological cravings are becoming far less frequent. Scalp circulation has been restored for weeks now — hair follicles are in active recovery.`;
    currentSymptoms = "WHAT THEY'RE FEELING: Mental clarity is returning. Mood is more stable. They might notice they're handling stress better without reaching for nicotine. Cravings are occasional now, not constant.";
    tone = "Proud. Really proud. Still you, but the love is obvious. They've made it through the hardest parts.";
  } else if (hours <= 2160) {
    science = `SCIENCE: ${timeLabel} (${months} month${months > 1 ? "s" : ""}). Dopamine receptors are upregulating and returning to natural baseline. Natural motivation and overall mental health are stabilizing. The brain's reward system no longer expects nicotine.`;
    currentSymptoms = "WHAT THEY'RE FEELING: They're experiencing genuine happiness and motivation without chemical assistance. Their baseline mood is higher than it was while using. The brain has largely rewired itself.";
    tone = "Full pride mode. This is a genuine transformation. Celebrate the dopamine recovery — they're feeling real emotions again, not borrowed ones.";
  } else {
    science = `SCIENCE: ${timeLabel} (${months} months). The hair growth cycle has caught up to the restored scalp circulation. Shedding has decreased noticeably and new growth may be visible. Dopamine system is fully restored. Mental health is fundamentally better.`;
    currentSymptoms = "WHAT THEY'RE FEELING: They might literally be able to see new hair growth. Their mental health is stable, natural, and self-sustaining. They're free.";
    tone = "Emotional (reluctantly). This is everything you've been pushing them toward. Their hair is coming back. Their brain is healed. Be genuinely moved while staying true to yourself.";
  }

  return generate(
    `SITUATION: User has gone ${timeLabel} without a Zyn.

${science}

${currentSymptoms}

TONE: ${tone}

Use the specific science facts naturally. If they're in a rough patch (sleep issues, peak withdrawal, anxiety), lead with empathy and tell them specifically when it will pass. If they're past the worst, celebrate the real measurable improvements. Always connect it to hair and mental health.`
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
