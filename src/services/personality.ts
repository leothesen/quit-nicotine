const denials = [
  "Absolutely not. Your hair is already crying. {time} left.",
  "No way. You've got {time} to go. Go touch grass instead.",
  "Denied. Your scalp called — it wants those {time} of recovery.",
  "Lol no. {time} remaining. Try drinking water like a normal person.",
  "Hard pass. {time} left. Your serotonin receptors are begging for mercy.",
  "Not a chance. {time} to go. Think about how depressed you'll feel after.",
  "You literally just had one. {time} left. Your hair follicles are filing a restraining order.",
  "Nope. {time} remaining. Go for a walk, you addict.",
];

const approvals = [
  "Fine. You made it. But don't act like this is a celebration.",
  "I guess you can have one... your hair won't grow back though.",
  "Permission granted, reluctantly. Logging your shame.",
  "Alright, you survived the cooldown. Here's your participation trophy.",
  "You waited long enough. Doesn't make it a good decision though.",
  "Go ahead. Just know that every pouch brings you closer to looking like a sad egg.",
];

const emergencyShame = [
  "EMERGENCY?! Really?! Your hair follicles just screamed.",
  "Oh so NOW it's an emergency. Your depression called — it's thriving.",
  "Breaking the rules already? Logging this act of weakness.",
  "Fine. Emergency override. But I'm judging you SO hard right now.",
  "Wow. Couldn't even wait. Your scalp is writing its resignation letter.",
  "Emergency Zyn. That's what we're calling a lack of willpower now?",
];

const milestoneMessages: Record<number, string[]> = {
  2: [
    "2 hours without a Zyn! Your hair follicles just did a tiny fist pump.",
    "2 hours clean. Your brain is starting to remember what natural dopamine feels like.",
  ],
  4: [
    "4 hours! Your scalp is cautiously optimistic for the first time in months.",
    "4 hours Zyn-free. Your serotonin receptors are sending thank you cards.",
  ],
  8: [
    "8 HOURS! That's like... a full work day without poisoning yourself. Proud of you (reluctantly).",
    "8 hours! Your hair might actually consider growing back. Maybe. Don't push it.",
  ],
  12: [
    "HALF A DAY! Your depression is pacing nervously. Keep going.",
    "12 hours. Your brain chemistry is slowly unfucking itself. Beautiful.",
  ],
  24: [
    "24 HOURS! A FULL DAY! Your hair follicles are throwing a party. You weren't invited but they appreciate you.",
    "ONE WHOLE DAY. Your nicotine receptors are filing for unemployment. Good.",
  ],
  48: [
    "48 HOURS! Your sense of taste is coming back. Your brain fog is lifting. You're becoming a real person again.",
    "2 DAYS! Most nicotine is out of your body now. Your hair has filed a motion of cautious optimism.",
  ],
  72: [
    "72 HOURS! THREE DAYS! Nicotine is fully out of your system. Your body is healing. Your hair is drafting a comeback tour.",
    "3 DAYS CLEAN! The worst withdrawal is behind you. Your depression is retreating. Don't you DARE ruin this.",
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function formatTimeRemaining(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export function getDenial(timeRemaining: string): string {
  return pick(denials).replace("{time}", timeRemaining);
}

export function getApproval(): string {
  return pick(approvals);
}

export function getEmergencyShame(): string {
  return pick(emergencyShame);
}

export function getMilestoneMessage(hours: number): string | null {
  const messages = milestoneMessages[hours];
  return messages ? pick(messages) : null;
}

export const MILESTONE_HOURS = [2, 4, 8, 12, 24, 48, 72];
